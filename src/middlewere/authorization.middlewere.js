import HttpAppError from "../uitilties/error/app-error.js";

export const authorize = (allowedRoles) => {
    return (req, res, next) => {
        const loggedInUserRole = req.authUser.role;

        if (!allowedRoles.includes(loggedInUserRole)) {
            throw new HttpAppError(
                "User is not authorized to access this resource",
                403,
                null,
                "UNAUTHORIZED"
            );
        }

        next();
    };
};
