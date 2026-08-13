import { z } from 'zod';
import usersData from '../../../../task/mocks/users.json';
import { UserSchema, type User, type PublicUser } from '$lib/schemas';

const users: User[] = z.array(UserSchema).parse(usersData);

export function findUserByEmail(email: string): User | undefined {
	const needle = email.toLowerCase();
	return users.find((user) => user.email.toLowerCase() === needle);
}

export function toPublicUser(user: User): PublicUser {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { password: _password, ...publicUser } = user;
	return publicUser;
}
