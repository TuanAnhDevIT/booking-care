import db from "../models/index"
import bcrypt from 'bcryptjs';

const salt = bcrypt.genSaltSync(10);

let hashUserPassword = (password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let hashPassword = await bcrypt.hashSync(password, salt);
            resolve(hashPassword);
        } catch (e) {
            reject(e);
        }
    })
}


let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            let isExist = await checkUserEmail(email);
            if (isExist) {
                //user already exist
                let user = await db.User.findOne({
                    where: { email: email },
                    attributes: ['email', 'roleId', 'password'],
                    raw: true
                });
                if (user) {
                    //compare password
                    let check = await bcrypt.compareSync(password, user.password);
                    if (check) {
                        userData.errCode = 0;
                        userData.errMessage = 'Ok';
                        delete user.password
                        userData.user = user;
                    } else {
                        userData.errCode = 3;
                        userData.errMessage = 'wrong password';
                    }
                } else {
                    userData.errCode = 2;
                    userData.errMessage = `User not found`

                }

            } else {
                //return err
                userData.errCode = 1;
                userData.errMessage = `your email isn't exist in your system. Plz try other email`
            }

            resolve(userData)

        } catch (e) {
            reject(e)
        }
    })
}


let checkUserEmail = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { email: userEmail }
            })
            if (user) {
                resolve(true)
            } else {
                resolve(false)
            }

        } catch (e) {
            reject(e);
        }
    })
}

let getAllUsers = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = '';
            if (userId === 'ALL') {
                users = await db.User.findAll({
                    attributes: {
                        exclude: ['password']
                    }
                })
            }
            if (userId && userId !== 'ALL') {
                users = await db.User.findOne({
                    where: { id: userId },
                    attributes: {
                        exclude: ['password']
                    }
                })
            }

            resolve(users)
        } catch (e) {
            reject(e)
        }
    })
}

let CreateNewUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            //check email is exist ?
            let check = await checkUserEmail(data.email);
            if (check === true) {
                resolve({
                    errCode: 1,
                    errMessage: "Your email is already in used, Plz try another email"
                })
            } else {
                let hashPasswordFromBcrypt = await hashUserPassword(data.password);
                await db.User.create({
                    email: data.email,
                    password: hashPasswordFromBcrypt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    address: data.address,
                    phonenumber: data.phonenumber,
                    gender: data.gender === '1' ? true : false,
                    roleId: data.roleId,
                })
                resolve({
                    errCode: 0,
                    Message: "OK"
                })

            }
        } catch (e) {
            reject(e);
        }
    })
}

let deleteUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        let foundUser = await db.User.findOne({
            where: { id: userId }
        })
        if (!foundUser) {
            resolve({
                errCode: 2,
                errMessage: `the user isn't exist`
            })
        }
        await db.User.destroy({
            where: { id: userId }
        })
        resolve({
            errCode: 0,
            Message: "the user is deleted"
        })
    })
}

let updateUserData = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id) {
                resolve({
                    errCode: 2,
                    errMessage: "Missing required parameters"
                })
            }
            let user = await db.User.findOne({
                where: { id: data.id },
                raw: false
            })
            if (user) {
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.address = data.address;

                await user.save();

                resolve({
                    errCode: 0,
                    Message: "update the user succeeds!"
                })
            } else {
                resolve({
                    errCode: 1,
                    errMessage: `User's not found!`
                })
            }

        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    handleUserLogin: handleUserLogin,
    getAllUsers: getAllUsers,
    CreateNewUser: CreateNewUser,
    updateUserData: updateUserData,
    deleteUser: deleteUser
}