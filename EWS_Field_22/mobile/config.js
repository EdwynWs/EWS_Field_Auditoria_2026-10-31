const raw =
  process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? "http://localhost:4000" : "");
if (!raw)
  throw Error("Configure EXPO_PUBLIC_API_URL antes de gerar o aplicativo.");
const url = new URL(raw);
if (
  url.username ||
  url.password ||
  url.search ||
  url.hash ||
  url.pathname !== "/" ||
  !["http:", "https:"].includes(url.protocol)
)
  throw Error("URL da API inválida.");
if (!__DEV__ && url.protocol !== "https:")
  throw Error("Build distribuída exige API HTTPS.");
export const API_URL = url.origin;
