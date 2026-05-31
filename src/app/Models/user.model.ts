export class User {
  id?: number;
  username: string;
  email: string;
  password: string;

  constructor(username: string, email: string, password: string, id?: number) {
    this.username = username;
    this.email = email;
    this.password = password;
    if (id) {
      this.id = id;
    }
  }
}
