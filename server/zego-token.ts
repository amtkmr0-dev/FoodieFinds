import { createCipheriv } from "crypto";

function randomInt(min: number, max: number) {
  return Math.ceil((min + (max - min)) * Math.random());
}

function makeNonce() {
  return randomInt(-2147483648, 2147483647);
}

function makeRandomIv() {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let index = 0; index < 16; index += 1) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return result;
}

function getAlgorithm(secret: string) {
  switch (Buffer.from(secret).length) {
    case 16:
      return "aes-128-cbc";
    case 24:
      return "aes-192-cbc";
    case 32:
      return "aes-256-cbc";
    default:
      throw new Error("ZEGO_SERVER_SECRET must be 16, 24, or 32 bytes long.");
  }
}

function aesEncrypt(plainText: string, secret: string, iv: string) {
  const cipher = createCipheriv(getAlgorithm(secret), secret, iv);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(plainText), cipher.final()]);
}

export function generateZegoToken04({
  appId,
  userId,
  serverSecret,
  roomId,
  effectiveTimeInSeconds = 3600,
  canPublish = true,
}: {
  appId: number;
  userId: string;
  serverSecret: string;
  roomId: string;
  effectiveTimeInSeconds?: number;
  canPublish?: boolean;
}) {
  if (!Number.isFinite(appId) || appId <= 0) {
    throw new Error("ZEGO_APP_ID is invalid.");
  }

  if (!userId) {
    throw new Error("userId is required.");
  }

  if (!roomId) {
    throw new Error("roomId is required.");
  }

  const createTime = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    room_id: roomId,
    privilege: {
      1: 1,
      2: canPublish ? 1 : 0,
    },
    stream_id_list: null,
  });

  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: makeNonce(),
    ctime: createTime,
    expire: createTime + effectiveTimeInSeconds,
    payload,
  };

  const iv = makeRandomIv();
  const encrypted = aesEncrypt(JSON.stringify(tokenInfo), serverSecret, iv);
  const expireBuffer = Buffer.alloc(8);
  expireBuffer.writeBigInt64BE(BigInt(tokenInfo.expire), 0);

  const ivLengthBuffer = Buffer.alloc(2);
  ivLengthBuffer.writeUInt16BE(iv.length, 0);

  const encryptedLengthBuffer = Buffer.alloc(2);
  encryptedLengthBuffer.writeUInt16BE(encrypted.byteLength, 0);

  const tokenBuffer = Buffer.concat([
    expireBuffer,
    ivLengthBuffer,
    Buffer.from(iv),
    encryptedLengthBuffer,
    encrypted,
  ]);

  return `04${tokenBuffer.toString("base64")}`;
}
