// src/lib/hashUtils.ts - VERSÃO CORRIGIDA

const SALT = 'colegio-lumos-salt-2025';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const saltedPassword = password + SALT;
  const data = encoder.encode(saltedPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  console.log('Senha digitada hash:', newHash);
  console.log('Hash no banco:', hash);
  console.log('São iguais?', newHash === hash);
  return newHash === hash;
}
