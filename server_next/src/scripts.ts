import { UserService } from "./modules/user/service";
import { UserInputCreate } from "./generated/prismabox/User";

const createAdminUser = async (email:string, password: string) => {
    const user: typeof UserInputCreate.static = {
        email,
        password,
        name: "Admin",
        permissions: [
            "photo.create",
            "photo.update",
            "photo.delete",
            "photo.get",
            "photo.upload",
            "user.create",
            "user.update",
            "user.delete",
            "user.get",
        ]
    }
    await UserService.add(user);
};

const run = async () => {
    const args = process.argv.slice(2);

    if (args[0] === "create-admin") {
        await createAdminUser(args[1], args[2]);
    }
}

run();