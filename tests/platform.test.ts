import { afterEach, describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { GET as getPlatform } from "../app/api/platform/route";
import { GET as getAccount } from "../app/api/account/route";
import { buildGdprExport, GDPR_EXPORT_SCHEMA } from "../lib/account-export";
import { calculatePlan } from "../lib/calculate";
import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  generateAesGcmKeyBytes,
  importAesGcmKey,
} from "../lib/crypto/aes-gcm";
import { dispatch, EVENT_BROKER_LIVE, publishToKafka, publishToSqs } from "../lib/events/broker";
import { listOutbox, resetEventBus, subscribe } from "../lib/events/bus";
import { GDPR_RIGHTS, PROCESSING_INVENTORY } from "../lib/gdpr";
import { OBJECT_STORAGE_LIVE, putEncryptedObjectToS3, wrapClientEncryptedObject } from "../lib/object-storage";
import { SAMPLE_PROFILES } from "../lib/samples";
import { SECURITY_HEADERS } from "../lib/security-headers";
import { platformStatus, SERVICES } from "../lib/services/manifest";
import { RULE_ENGINE } from "../lib/services/rule-engine";
import { DOCUMENT_SERVICE } from "../lib/services/documents";

afterEach(() => {
  resetEventBus();
});

describe("platform architecture", () => {
  it("keeps four services in one app instead of live microservices or brokers", () => {
    const status = platformStatus();
    expect(status.architecture).toBe("modular-monolith");
    expect(status.microservices).toBe(false);
    expect(status.events.brokerLive).toBe(false);
    expect(status.objectStorage.live).toBe(false);
    expect(status.iso27001.certified).toBe(false);
    expect(SERVICES.map((item) => item.id)).toEqual([
      "rule-engine",
      "documents",
      "notifications",
      "analytics",
    ]);
    expect(EVENT_BROKER_LIVE).toBe(false);
    expect(OBJECT_STORAGE_LIVE).toBe(false);
  });

  it("runs the rule engine as the same on-device function the dashboard uses", () => {
    expect(RULE_ENGINE.location).toBe("on-device");
    expect(RULE_ENGINE.run).toBe(calculatePlan);
    expect(DOCUMENT_SERVICE.location).toBe("on-device");
    expect(DOCUMENT_SERVICE.objectStorageLive).toBe(false);
  });

  it("publishes domain events in-process and refuses SQS/Kafka", async () => {
    const seen: string[] = [];
    subscribe("rules.synced", (event) => {
      seen.push(event.type);
    });
    const result = await dispatch("rules.synced", "rule-engine", { fetched: 2, changed: 1 });
    expect(result.published).toBe(true);
    expect(result.transport).toBe("memory");
    expect(seen).toEqual(["rules.synced"]);
    expect(listOutbox().some((item) => item.type === "rules.synced")).toBe(true);
    expect((await publishToSqs(result.event)).published).toBe(false);
    expect((await publishToSqs(result.event)).reason).toMatch(/SQS|Kafka|not connected/i);
    expect((await publishToKafka(result.event)).published).toBe(false);
  });
});

describe("encryption and object storage", () => {
  it("round-trips AES-GCM and refuses S3 upload", async () => {
    const raw = await generateAesGcmKeyBytes();
    const key = await importAesGcmKey(raw);
    const { iv, ciphertext } = await aesGcmEncrypt(new TextEncoder().encode("vault-bytes"), key);
    const plain = await aesGcmDecrypt(ciphertext, iv, key);
    expect(new TextDecoder().decode(plain)).toBe("vault-bytes");
    const wrapped = wrapClientEncryptedObject(iv, ciphertext);
    expect(wrapped.keyLocation).toBe("client-only");
    const put = await putEncryptedObjectToS3(wrapped);
    expect(put.stored).toBe(false);
    expect(put.reason).toMatch(/S3 is not connected/i);
  });
});

describe("GDPR inventory and portability", () => {
  it("lists device vault processing and core rights", () => {
    expect(PROCESSING_INVENTORY.find((row) => row.id === "vault")?.location).toBe("device");
    expect(GDPR_RIGHTS.map((item) => item.id)).toEqual(
      expect.arrayContaining(["access", "portability", "erasure", "minimisation"]),
    );
  });

  it("builds a portable export without password hashes or vault blobs", () => {
    const profile = SAMPLE_PROFILES[0].profile;
    const pack = buildGdprExport({
      email: "user@example.com",
      name: "Test",
      plan: "basic",
      createdAt: "2026-08-16T00:00:00.000Z",
      profile,
      planResult: calculatePlan(profile),
      organisations: [],
      enquiries: [],
      shareLinks: [],
    });
    expect(pack.schema).toBe("route-to-citizenship.gdpr.v1");
    expect(pack.vault.uploaded).toBe(false);
    const json = JSON.stringify(pack);
    expect(json).not.toMatch(/passwordHash/i);
    expect(json).not.toMatch(/passport\s+\d{8,}/i);
    expect(GDPR_EXPORT_SCHEMA).toBe("route-to-citizenship.gdpr.v1");
  });
});

describe("security headers and platform API", () => {
  it("sets nosniff, frame deny and a geolocation self policy", () => {
    const keys = SECURITY_HEADERS.map((item) => item.key);
    expect(keys).toContain("X-Content-Type-Options");
    expect(keys).toContain("X-Frame-Options");
    expect(SECURITY_HEADERS.find((item) => item.key === "Permissions-Policy")?.value).toMatch(
      /geolocation=\(self\)/,
    );
  });

  it("GET /api/platform describes the honest layout", async () => {
    const response = await getPlatform();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.microservices).toBe(false);
    expect(json.iso27001.certified).toBe(false);
  });

  it("GET /api/account still requires a session", async () => {
    expect((await getAccount()).status).toBe(401);
  });

  it("builds a Node/Docker standalone server, not a static export", () => {
    expect(nextConfig.output).toBe("standalone");
  });
});
