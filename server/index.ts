import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

// Apple Pay domain verification - embedded content for reliable production serving
// Domain: thesamanapp.com - Updated Jan 28, 2026 19:45:28
const APPLE_PAY_VERIFICATION_CONTENT = `MIIQYgYJKoZIhvcNAQcCoIIQUzCCEE8CAQExCzAJBgUrDgMCGgUAMHEGCSqGSIb3DQEHAaBkBGJ7
InRlYW1JZCI6IktRNTQyUTk4SDIiLCJkb21haW4iOiJ0aGVzYW1hbmFwcC5jb20iLCJkYXRlQ3Jl
YXRlZCI6IjIwMjYtMDEtMjgsMTk6NDU6MjgiLCJ2ZXJzaW9uIjoxfaCCDT8wggQ0MIIDHKADAgEC
Agg9Wfg36tHYnzANBgkqhkiG9w0BAQsFADBzMS0wKwYDVQQDDCRBcHBsZSBpUGhvbmUgQ2VydGlm
aWNhdGlvbiBBdXRob3JpdHkxIDAeBgNVBAsMF0NlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYD
VQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzAeFw0yNDEyMTYxOTIxMDFaFw0yOTEyMTExODEz
NTlaMFkxNTAzBgNVBAMMLEFwcGxlIGlQaG9uZSBPUyBQcm92aXNpb25pbmcgUHJvZmlsZSBTaWdu
aW5nMRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzCCASIwDQYJKoZIhvcNAQEBBQAD
ggEPADCCAQoCggEBANCTMav4Ux7frR4vZPfJTdeWvl9LPXlkXEPuKcNA0vovHKC2vBFz7_AisN_e
-fnOVeP1QgG1I2VBEjv3fEZ9iRNFlUTslpViZpeQAwDZ4K7F2bGcIC2W4IXtb2vTUtODPNQBIyXp
5cbUEdh5qgjC3RVY9e-Kk0sNS-4NtoeTdREQVcsMeAfbN3BGO5f6xOt4KeD07HjjYdpAV4AHu4ic
pcdJbcgm05UfTSGijWhzgx7mWVqFllVUsJUuJdx3DWGHgY2JpAN7PAB3LIlqWdNkRNl0pVuKsVJh
X24EMNTz4hA0DJWMS-F71iuFg_InOY1wCCPiFIj_k_QtbUwm4os3hi0CAwEAAaOB5TCB4jAMBgNV
HRMBAf8EAjAAMB8GA1UdIwQYMBaAFG_xlRhiXODI8cXtbBjJ4NNkUpggMEAGCCsGAQUFBwEBBDQw
MjAwBggrBgEFBQcwAYYkaHR0cDovL29jc3AuYXBwbGUuY29tL29jc3AwMy1haXBjYTA3MC8GA1Ud
HwQoMCYwJKAioCCGHmh0dHA6Ly9jcmwuYXBwbGUuY29tL2FpcGNhLmNybDAdBgNVHQ4EFgQUvLXF
6b38y9Ce3JSwHvghlFz_CS4wDgYDVR0PAQH_BAQDAgeAMA8GCSqGSIb3Y2QGOgQCBQAwDQYJKoZI
hvcNAQELBQADggEBADI0wul3ql_gxsqi83dZ54pnuPFR8_uw9pe_sRGj4aE8uyOS6RKTonEdvPGa
cW-kPG82krbgR4Kik-PnuI-73yVEYgLPzbz3-42KCXB4ZcIZTSXLcmIh5Klo-RCaLnoPKL6mAwbR
VWEfr3z4lNRxDuLTJVSLzq3VaAdbvS17x2JFebmph0z4GDuArhBLcdh4K-YKr5rn2U3M6lu3o5dV
a-wNoHjHwLDPy9wQTDCSE3GU1q_g7MnpyZvOJTLuEQ0hFySL8ZUuImJGRX_g29cWVMG5PtPairll
9rS0I394XdlydmRjpwhVx9m3lNsjv_OTp9QEREMNyuJWsiuUKKQ9cocwggREMIIDLKADAgECAghc
Y8rkSjdTyTANBgkqhkiG9w0BAQsFADBiMQswCQYDVQQGEwJVUzETMBEGA1UEChMKQXBwbGUgSW5j
LjEmMCQGA1UECxMdQXBwbGUgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkxFjAUBgNVBAMTDUFwcGxl
IFJvb3QgQ0EwHhcNMTcwNTEwMjEyNzMwWhcNMzAxMjMxMDAwMDAwWjBzMS0wKwYDVQQDDCRBcHBs
ZSBpUGhvbmUgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkxIDAeBgNVBAsMF0NlcnRpZmljYXRpb24g
QXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzCCASIwDQYJKoZIhvcN
AQEBBQADggEPADCCAQoCggEBAMlFagEPPoMEhsf8v9xe8B6B7hcwc2MmLt49eiTNkz5POUe6db7z
wNLxWaKrH_4KhjzZLZoH8g5ruSmRGl8iCovxclgFrkxLRMV5p4A8sIjgjAwnhF0Z5YcZNsvjxXa3
sPRBclH0BVyDS6JtplG48Sbfe16tZQzGsphRjLt9G0zBTsgIx9LtZAu03RuNT0B9G49IlpJb89CY
ftm8pBkOmWG7QV0BzFt3en0k0NzTU__D3MWULLZaTY4YIzm92cZSPtHy9CWKoSqH_dgMRilR_-0X
bIkla4e_imkUn3efwxW3aLOIRb2E5gYCQWQPrSoouBXJ4KynirpyBDSyeIz4soUCAwEAAaOB7DCB
6TAPBgNVHRMBAf8EBTADAQH_MB8GA1UdIwQYMBaAFCvQaUeUdgn-9GuNLkCm90dNfwheMEQGCCsG
AQUFBwEBBDgwNjA0BggrBgEFBQcwAYYoaHR0cDovL29jc3AuYXBwbGUuY29tL29jc3AwMy1hcHBs
ZXJvb3RjYTAuBgNVHR8EJzAlMCOgIaAfhh1odHRwOi8vY3JsLmFwcGxlLmNvbS9yb290LmNybDAd
BgNVHQ4EFgQUb_GVGGJc4Mjxxe1sGMng02RSmCAwDgYDVR0PAQH_BAQDAgEGMBAGCiqGSIb3Y2QG
AhIEAgUAMA0GCSqGSIb3DQEBCwUAA4IBAQA6z6yYjb6SICEJrZXzsVwh-jYtVyBEdHNkkgizlqz3
bZf6WzQ4J88SRtM8EfAHyZmQsdHoEQml46VrbGMIP54l-tWZnEzm5c6Osk1o7Iuro6JPihEVPtwU
KxzGRLZvZ8VbT5UpLYdcP9yDHndP7dpUpy3nE4HBY8RUCxtLCmooIgjUN5J8f2coX689P7esWR04
NGRa7jNKGUJEKcTKGGvhwVMtLfRNwhX2MzIYePEmb4pN65RMo-j_D7MDi2Xa6y7YZVCf3J-K3zGo
hFTcUlJB0rITHTFGR4hfPu7D8owjBJXrrIo-gmwGny7ji0OaYls0DfSZzyzuunKGGSOl_I61MIIE
uzCCA6OgAwIBAgIBAjANBgkqhkiG9w0BAQUFADBiMQswCQYDVQQGEwJVUzETMBEGA1UEChMKQXBw
bGUgSW5jLjEmMCQGA1UECxMdQXBwbGUgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkxFjAUBgNVBAMT
DUFwcGxlIFJvb3QgQ0EwHhcNMDYwNDI1MjE0MDM2WhcNMzUwMjA5MjE0MDM2WjBiMQswCQYDVQQG
EwJVUzETMBEGA1UEChMKQXBwbGUgSW5jLjEmMCQGA1UECxMdQXBwbGUgQ2VydGlmaWNhdGlvbiBB
dXRob3JpdHkxFjAUBgNVBAMTDUFwcGxlIFJvb3QgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
ggEKAoIBAQDkkakJH5HbHkdQ6wXtXnmELes2oldMVeyLGYne-Uts9QerIjAC6Bg--FAJ039BqJj5
0cpmnCRrEdCju-QbKsMflZ56DKRHi1vUFjczy8QPTc4UadHJGXL1XQ7Vf1-b8iUDulWPTV0N8WQ1
IxVLFVkds5T31pyez1C6wVhQZ48ItCD3y6wsIG9wtj8BMIy3Q88PnT3zK0koGsj-zrW5DtleHNbL
PbU6rfQPDgCSC7EhFi501TwN22IWq6NxkkdTVcGvL0Gz-PvjcM3mo0xFfh9Ma1CWQYnEdGILEINB
hzOKgbEwWOxaBDKMaLOPHd5lc_9nXmW8Sdh2nzMUZaF3lMktAgMBAAGjggF6MIIBdjAOBgNVHQ8B
Af8EBAMCAQYwDwYDVR0TAQH_BAUwAwEB_zAdBgNVHQ4EFgQUK9BpR5R2Cf70a40uQKb3R01_CF4w
HwYDVR0jBBgwFoAUK9BpR5R2Cf70a40uQKb3R01_CF4wggERBgNVHSAEggEIMIIBBDCCAQAGCSqG
SIb3Y2QFATCB8jAqBggrBgEFBQcCARYeaHR0cHM6Ly93d3cuYXBwbGUuY29tL2FwcGxlY2EvMIHD
BggrBgEFBQcCAjCBthqBs1JlbGlhbmNlIG9uIHRoaXMgY2VydGlmaWNhdGUgYnkgYW55IHBhcnR5
IGFzc3VtZXMgYWNjZXB0YW5jZSBvZiB0aGUgdGhlbiBhcHBsaWNhYmxlIHN0YW5kYXJkIHRlcm1z
IGFuZCBjb25kaXRpb25zIG9mIHVzZSwgY2VydGlmaWNhdGUgcG9saWN5IGFuZCBjZXJ0aWZpY2F0
aW9uIHByYWN0aWNlIHN0YXRlbWVudHMuMA0GCSqGSIb3DQEBBQUAA4IBAQBcNplMLXi37Yyb3PN3
m_J20ncwT8EfhYOFG5k9RzfyqZtAjizUsZAS2L70c5vu0mQPy3lPNNiiPvl4_2vIB-x9OYOLUyDT
OMSxv5pPCmv_K_xZpwUJfBdAVhEedNO3iyM7R6PVbyTi69G3cN8PReEnyvFteO3ntRcXqNx-IjXK
JdXZD9Zr1KIkIxH3oayPc4FgxhtbCS-SsvhESPBgOJ4V9T0mZyCKM2r3DYLP3uujL_lTaltkwGMz
d_c6ByxW69oPIQ7aunMZT7XZNn_Bh1XZp5m5MkL72NVxnn6hUrcbvZNCJBIqxw8dtk2cXmPIS4AX
UKqK1drk_NAJBzewdXUhMYIChTCCAoECAQEwfzBzMS0wKwYDVQQDDCRBcHBsZSBpUGhvbmUgQ2Vy
dGlmaWNhdGlvbiBBdXRob3JpdHkxIDAeBgNVBAsMF0NlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMw
EQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUwIIPVn4N-rR2J8wCQYFKw4DAhoFAKCB3DAY
BgkqhkiG9w0BCQMxCwYJKoZIhvcNAQcBMBwGCSqGSIb3DQEJBTEPFw0yNjAxMjgxOTQ1MjhaMCMG
CSqGSIb3DQEJBDEWBBTZA1S4MmXlkhcqMCg_G1dsyYr-HDApBgkqhkiG9w0BCTQxHDAaMAkGBSsO
AwIaBQChDQYJKoZIhvcNAQEBBQAwUgYJKoZIhvcNAQkPMUUwQzAKBggqhkiG9w0DBzAOBggqhkiG
9w0DAgICAIAwDQYIKoZIhvcNAwICAUAwBwYFKw4DAgcwDQYIKoZIhvcNAwICASgwDQYJKoZIhvcN
AQEBBQAEggEAtNm7r8Yr6UXeyCq_60alsq6NsZH7hJYP4mNwTzSBHxmTRakEwxgSnIhd6xyHFT8n
k2i_RW-mWyapOYSLLo8Uu9jYukpCZsAH0okfiUPxxqDctyyB-GdnI2AbFgTAGPTUDJFfndAI7Js1
PrytPzMK3VwqGysfamjPUdmyPOWdKYD5AEffdhSlk01ouJAF9RnTrQm1qGJheBQmj4v7nMaQcEjV
plS4w_cYZyxXXnMckUnxaPB5FNGXFF-WaV1FqKXUz1v452haqkUwbRl3OWxUmUmGdHuTivqEhWOt
Ms8sHq1s7M5Bqyn7ya3a7dPI9UPFzc_U_OF583DGAvDsmYhtVQ`;

// Serve Apple Pay domain verification - embedded for reliable production serving
const serveApplePayVerification = (_req: express.Request, res: express.Response) => {
  console.log("[ApplePay] Serving embedded verification content");
  res.type("text/plain").send(APPLE_PAY_VERIFICATION_CONTENT);
};

// Serve at both URLs (with and without .txt extension)
app.get("/.well-known/apple-developer-merchantid-domain-association", serveApplePayVerification);
app.get("/.well-known/apple-developer-merchantid-domain-association.txt", serveApplePayVerification);

// Serve certificate files for download (temporary - for sending to Telr)
app.get("/downloads/apple_pay_new.cer", (_req, res) => {
  const filePath = path.join(process.cwd(), "certs", "apple_pay_new.cer");
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send("File not found");
  }
});
app.get("/downloads/apple_pay_key.p12", (_req, res) => {
  const filePath = path.join(process.cwd(), "certs", "apple_pay_key.p12");
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
