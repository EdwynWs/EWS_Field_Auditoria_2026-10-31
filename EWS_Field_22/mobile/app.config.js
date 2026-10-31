module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  if (["preview", "production"].includes(profile)) {
    const raw = process.env.EXPO_PUBLIC_API_URL;
    if (!raw)
      throw Error(
        "Configure EXPO_PUBLIC_API_URL no environment EAS selecionado.",
      );
    const u = new URL(raw);
    if (
      u.protocol !== "https:" ||
      /(:|\.(invalid|example|test|local)$)/i.test(u.hostname) ||
      u.username ||
      u.password ||
      u.pathname !== "/" ||
      u.search ||
      u.hash ||
      /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
        u.hostname,
      )
    )
      throw Error("A API do APK/AAB deve usar uma origem HTTPS pública.");
  }
  return config;
};
