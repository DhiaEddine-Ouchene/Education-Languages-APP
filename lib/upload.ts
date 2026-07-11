import crypto from "crypto";

type ResourceType = "image" | "video"; // Cloudinary treats audio as "video"

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: ResourceType = "image"
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]));
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id };
}
