/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack: {
    target: "web",
    resolve: {
      mainFields: ["browser", "module", "main"]
    }
  }
}