export function setCookie(res, name, value, options = {}) {
  const {
    httpOnly = true,
    path = '/',
    maxAge,
    sameSite = 'Lax',
    secure = true
  } = options;

  let cookie = `${name}=${value}; Path=${path}; SameSite=${sameSite};`;
  if (httpOnly) cookie += ' HttpOnly;';
  if (secure) cookie += ' Secure;';
  if (maxAge) cookie += ` Max-Age=${maxAge};`;
  res.setHeader('Set-Cookie', cookie);
}

export function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const map = Object.fromEntries(raw.split(';').map(c => c.trim().split('=')));
  return map[name];
}

export function clearCookie(res, name) {
  res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure;`);
}
