export class User {
  constructor({ id, role_id, full_name, email, role, status }) {
    this.id = Number(id);
    this.role_id = role_id === undefined ? undefined : Number(role_id);
    this.full_name = full_name;
    this.email = email;
    this.role = role;
    this.status = status;
  }

  static toPublic(record) {
    const user = new User(record);
    return { id: user.id, full_name: user.full_name, email: user.email, role: user.role };
  }
}