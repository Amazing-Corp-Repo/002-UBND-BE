import env from '../config/environment.config.js';
import ROLE from '../constants/role.constant.js';
import UserRepository from '../repositories/user.repository.js';
import { hash } from '../utils/bcrypt.util.js';

export const CreateAccountSeed = async () => {
    const username = env.ADMIN_USERNAME;
    const password = env.ADMIN_PASSWORD;
    const email = env.ADMIN_EMAIL;

    let user = await UserRepository.findUserByUsername(username);
    if (!user) {
        user = await UserRepository.createUser({
            ten_dang_nhap: username,
            mat_khau: await hash(password),
            vai_tro: ROLE.ADMIN,
            email: email
        });
    }
    console.log('Admin account have been created with username: ', username, ' password: ', password);
};
