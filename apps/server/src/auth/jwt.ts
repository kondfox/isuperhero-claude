import { jwtVerify, SignJWT } from 'jose'

export interface JwtPayload {
  sub: string
  username?: string
  iat?: number
  exp?: number
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

export async function signAccessToken(payload: { sub: string; username: string }): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecret())
}

export async function signRefreshToken(payload: { sub: string }): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  return {
    sub: payload.sub as string,
    username: payload.username as string,
    iat: payload.iat,
    exp: payload.exp,
  }
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  return {
    sub: payload.sub as string,
    iat: payload.iat,
    exp: payload.exp,
  }
}
