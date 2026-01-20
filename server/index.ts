import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

// Apple Pay domain verification - embedded content for reliable production serving
const APPLE_PAY_VERIFICATION_CONTENT = `MIIQbQYJKoZIhvcNAQcCoIIQXjCCEFoCAQExCzAJBgUrDgMCGgUAMHwGCSqGSIb3DQEHAaBvBG17
InRlYW1JZCI6IktRNTQyUTk4SDIiLCJkb21haW4iOiJ4ZXItLXNhZWVkaG9rYWwucmVwbGl0LmFw
cCIsImRhdGVDcmVhdGVkIjoiMjAyNi0wMS0yMCwyMzoxNDoyNiIsInZlcnNpb24iOjF9oIINPzCC
BDQwggMcoAMCAQICCD1Z-Dfq0difMA0GCSqGSIb3DQEBCwUAMHMxLTArBgNVBAMMJEFwcGxlIGlQ
aG9uZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTEgMB4GA1UECwwXQ2VydGlmaWNhdGlvbiBBdXRo
b3JpdHkxEzARBgNVBAoMCkFwcGxlIEluYy4xCzAJBgNVBAYTAlVTMB4XDTI0MTIxNjE5MjEwMVoX
DTI5MTIxMTE4MTM1OVowWTE1MDMGA1UEAwwsQXBwbGUgaVBob25lIE9TIFByb3Zpc2lvbmluZyBQ
cm9maWxlIFNpZ25pbmcxEzARBgNVBAoMCkFwcGxlIEluYy4xCzAJBgNVBAYTAlVTMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0JMxq_hTHt-tHi9k98lN15a-X0s9eWRcQ-4pw0DS-i8c
oLa8EXPv8CKw3975-c5V4_VCAbUjZUESO_d8Rn2JE0WVROyWlWJml5ADANngrsXZsZwgLZbghe1v
a9NS04M81AEjJenlxtQR2HmqCMLdFVj174qTSw1L7g22h5N1ERBVywx4B9s3cEY7l_rE63gp4PTs
eONh2kBXgAe7iJylx0ltyCbTlR9NIaKNaHODHuZZWoWWVVSwlS4l3HcNYYeBjYmkA3s8AHcsiWpZ
02RE2XSlW4qxUmFfbgQw1PPiEDQMlYxL4XvWK4WD8ic5jXAII-IUiP-T9C1tTCbiizeGLQIDAQAB
o4HlMIHiMAwGA1UdEwEB_wQCMAAwHwYDVR0jBBgwFoAUb_GVGGJc4Mjxxe1sGMng02RSmCAwQAYI
KwYBBQUHAQEENDAyMDAGCCsGAQUFBzABhiRodHRwOi8vb2NzcC5hcHBsZS5jb20vb2NzcDAzLWFp
cGNhMDcwLwYDVR0fBCgwJjAkoCKgIIYeaHR0cDovL2NybC5hcHBsZS5jb20vYWlwY2EuY3JsMB0G
A1UdDgQWBBS8tcXpvfzL0J7clLAe-CGUXP8JLjAOBgNVHQ8BAf8EBAMCB4AwDwYJKoZIhvdjZAY6
BAIFADANBgkqhkiG9w0BAQsFAAOCAQEAMjTC6XeqX-DGyqLzd1nnime48VHz-7D2l7-xEaPhoTy7
I5LpEpOicR288Zpxb6Q8bzaStuBHgqKT4-e4j7vfJURiAs_NvPf7jYoJcHhlwhlNJctyYiHkqWj5
EJoueg8ovqYDBtFVYR-vfPiU1HEO4tMlVIvOrdVoB1u9LXvHYkV5uamHTPgYO4CuEEtx2Hgr5gqv
mufZTczqW7ejl1Vr7A2geMfAsM_L3BBMMJITcZTWr-DsyenJm84lMu4RDSEXJIvxlS4iYkZFf-Db
1xZUwbk-09qKuWX2tLQjf3hd2XJ2ZGOnCFXH2beU2yO_85On1AREQw3K4layK5QopD1yhzCCBEQw
ggMsoAMCAQICCFxjyuRKN1PJMA0GCSqGSIb3DQEBCwUAMGIxCzAJBgNVBAYTAlVTMRMwEQYDVQQK
EwpBcHBsZSBJbmMuMSYwJAYDVQQLEx1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTEWMBQG
A1UEAxMNQXBwbGUgUm9vdCBDQTAeFw0xNzA1MTAyMTI3MzBaFw0zMDEyMzEwMDAwMDBaMHMxLTAr
BgNVBAMMJEFwcGxlIGlQaG9uZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTEgMB4GA1UECwwXQ2Vy
dGlmaWNhdGlvbiBBdXRob3JpdHkxEzARBgNVBAoMCkFwcGxlIEluYy4xCzAJBgNVBAYTAlVTMIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyUVqAQ8-gwSGx_y_3F7wHoHuFzBzYyYu3j16
JM2TPk85R7p1vvPA0vFZoqsf_gqGPNktmgfyDmu5KZEaXyIKi_FyWAWuTEtExXmngDywiOCMDCeE
XRnlhxk2y-PFdrew9EFyUfQFXINLom2mUbjxJt97Xq1lDMaymFGMu30bTMFOyAjH0u1kC7TdG41P
QH0bj0iWklvz0Jh-2bykGQ6ZYbtBXQHMW3d6fSTQ3NNT_8PcxZQstlpNjhgjOb3ZxlI-0fL0JYqh
Kof92AxGKVH_7RdsiSVrh7-KaRSfd5_DFbdos4hFvYTmBgJBZA-tKii4FcngrKeKunIENLJ4jPiy
hQIDAQABo4HsMIHpMA8GA1UdEwEB_wQFMAMBAf8wHwYDVR0jBBgwFoAUK9BpR5R2Cf70a40uQKb3
R01_CF4wRAYIKwYBBQUHAQEEODA2MDQGCCsGAQUFBzABhihodHRwOi8vb2NzcC5hcHBsZS5jb20v
b2NzcDAzLWFwcGxlcm9vdGNhMC4GA1UdHwQnMCUwI6AhoB-GHWh0dHA6Ly9jcmwuYXBwbGUuY29t
L3Jvb3QuY3JsMB0GA1UdDgQWBBRv8ZUYYlzgyPHF7WwYyeDTZFKYIDAOBgNVHQ8BAf8EBAMCAQYw
EAYKKoZIhvdjZAYCEgQCBQAwDQYJKoZIhvcNAQELBQADggEBADrPrJiNvpIgIQmtlfOxXCH6Ni1X
IER0c2SSCLOWrPdtl_pbNDgnzxJG0zwR8AfJmZCx0egRCaXjpWtsYwg_niX61ZmcTOblzo6yTWjs
i6ujok-KERU-3BQrHMZEtm9nxVtPlSkth1w_3IMed0_t2lSnLecTgcFjxFQLG0sKaigiCNQ3knx_
Zyhfrz0_t6xZHTg0ZFruM0oZQkQpxMoYa-HBUy0t9E3CFfYzMhh48SZvik3rlEyj6P8PswOLZdrr
LthlUJ_cn4rfMaiEVNxSUkHSshMdMUZHiF8-7sPyjCMEleusij6CbAafLuOLQ5piWzQN9JnPLO66
coYZI6X8jrUwggS7MIIDo6ADAgECAgECMA0GCSqGSIb3DQEBBQUAMGIxCzAJBgNVBAYTAlVTMRMw
EQYDVQQKEwpBcHBsZSBJbmMuMSYwJAYDVQQLEx1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0
eTEWMBQGA1UEAxMNQXBwbGUgUm9vdCBDQTAeFw0wNjA0MjUyMTQwMzZaFw0zNTAyMDkyMTQwMzZa
MGIxCzAJBgNVBAYTAlVTMRMwEQYDVQQKEwpBcHBsZSBJbmMuMSYwJAYDVQQLEx1BcHBsZSBDZXJ0
aWZpY2F0aW9uIEF1dGhvcml0eTEWMBQGA1UEAxMNQXBwbGUgUm9vdCBDQTCCASIwDQYJKoZIhvcN
AQEBBQADggEPADCCAQoCggEBAOSRqQkfkdseR1DrBe1eeYQt6zaiV0xV7IsZid75S2z1B6siMALo
GD74UAnTf0GomPnRymacJGsR0KO75Bsqwx-VnnoMpEeLW9QWNzPLxA9NzhRp0ckZcvVdDtV_X5vy
JQO6VY9NXQ3xZDUjFUsVWR2zlPf2nJ7PULrBWFBnjwi0IPfLrCwgb3C2PwEwjLdDzw-dPfMrSSga
yP7OtbkO2V4c1ss9tTqt9A8OAJILsSEWLnTVPA3bYharo3GSR1NVwa8vQbP4--NwzeajTEV-H0xr
UJZBicR0YgsQg0GHM4qBsTBY7FoEMoxos48d3mVz_2deZbxJ2HafMxRloXeUyS0CAwEAAaOCAXow
ggF2MA4GA1UdDwEB_wQEAwIBBjAPBgNVHRMBAf8EBTADAQH_MB0GA1UdDgQWBBQr0GlHlHYJ_vRr
jS5ApvdHTX8IXjAfBgNVHSMEGDAWgBQr0GlHlHYJ_vRrjS5ApvdHTX8IXjCCAREGA1UdIASCAQgw
ggEEMIIBAAYJKoZIhvdjZAUBMIHyMCoGCCsGAQUFBwIBFh5odHRwczovL3d3dy5hcHBsZS5jb20v
YXBwbGVjYS8wgcMGCCsGAQUFBwICMIG2GoGzUmVsaWFuY2Ugb24gdGhpcyBjZXJ0aWZpY2F0ZSBi
eSBhbnkgcGFydHkgYXNzdW1lcyBhY2NlcHRhbmNlIG9mIHRoZSB0aGVuIGFwcGxpY2FibGUgc3Rh
bmRhcmQgdGVybXMgYW5kIGNvbmRpdGlvbnMgb2YgdXNlLCBjZXJ0aWZpY2F0ZSBwb2xpY3kgYW5k
IGNlcnRpZmljYXRpb24gcHJhY3RpY2Ugc3RhdGVtZW50cy4wDQYJKoZIhvcNAQEFBQADggEBAFw2
mUwteLftjJvc83eb8nbSdzBPwR-Fg4UbmT1HN_Kpm0COLNSxkBLYvvRzm-7SZA_LeU802KI--Xj_
a8gH7H05g4tTINM4xLG_mk8Ka_8r_FmnBQl8F0BWER5007eLIztHo9VvJOLr0bdw3w9F4SfK8W14
7ee1Fxeo3H4iNcol1dkP1mvUoiQjEfehrI9zgWDGG1sJL5Ky-ERI8GA4nhX1PSZnIIozavcNgs_e
66Mv-VNqW2TAYzN39zoHLFbr2g8hDtq6cxlPtdk2f8GHVdmnmbkyQvvY1XGefqFStxu9k0IkEirH
Dx22TZxeY8hLgBdQqorV2uT80AkHN7B1dSExggKFMIICgQIBATB_MHMxLTArBgNVBAMMJEFwcGxl
IGlQaG9uZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTEgMB4GA1UECwwXQ2VydGlmaWNhdGlvbiBB
dXRob3JpdHkxEzARBgNVBAoMCkFwcGxlIEluYy4xCzAJBgNVBAYTAlVTAgg9Wfg36tHYnzAJBgUr
DgMCGgUAoIHcMBgGCSqGSIb3DQEJAzELBgkqhkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTI2MDEy
MDIzMTQyNlowIwYJKoZIhvcNAQkEMRYEFGjocYyQqiFuJMaO_C0kOSIAxcwpMCkGCSqGSIb3DQEJ
NDEcMBowCQYFKw4DAhoFAKENBgkqhkiG9w0BAQEFADBSBgkqhkiG9w0BCQ8xRTBDMAoGCCqGSIb3
DQMHMA4GCCqGSIb3DQMCAgIAgDANBggqhkiG9w0DAgIBQDAHBgUrDgMCBzANBggqhkiG9w0DAgIB
KDANBgkqhkiG9w0BAQEFAASCAQBEsdu1X03xAsDlll_jZHl-zxTzlF3rKcZhrshH1PNZOpGKkROd
VG_iADvcak0gwTvhwhnyBxrAy4weym6cY3WzoyJCHHANicYzvWcWKZYcCCDMubKM7gnYfeW6OYx2
NqbcZDPGem7lOjLd-EW7xwcYtY9HygR_hW2EYMzczOi7cPCun3NSyyLmnYQHgRDO9SbLqmDhhxKe
o36P1yf6cl_x91EVcvB6p-QXK_3ApCtAgOusBF1ui_RhLYiOHQNPypFV6Zt8AfK3yFo0d90LxqXz
1IfcHRRRg_h4tOK40hK15jLB7RtdYnI5aSUMMZUHDIZ0p-JQ7LFZfZlD8kcvjFju`;

// Serve Apple Pay domain verification - embedded for reliable production serving
const serveApplePayVerification = (_req: express.Request, res: express.Response) => {
  console.log("[ApplePay] Serving embedded verification content");
  res.type("text/plain").send(APPLE_PAY_VERIFICATION_CONTENT);
};

// Serve at both URLs (with and without .txt extension)
app.get("/.well-known/apple-developer-merchantid-domain-association", serveApplePayVerification);
app.get("/.well-known/apple-developer-merchantid-domain-association.txt", serveApplePayVerification);

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
