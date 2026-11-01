export function meDto(u: any) {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name,
    username: u.username || null,
    photoUrl: u.photoUrl,
    phone: u.phone,
    affiliation: u.affiliation,
    department: u.department,
    level: u.level,
    verified: u.verified,
    role: u.role,
    isSeller: u.isSeller,
    onboarded: u.onboarded,
    emailVerified: !!u.emailVerified,
  };
}

export function publicUserDto(u: any) {
  return {
    id: String(u._id),
    name: u.name,
    username: u.username || null,
    photoUrl: u.photoUrl,
    verified: !!u.verified,
    isSeller: !!u.isSeller,
  };
}
