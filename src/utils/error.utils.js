


export function errorCodeForStatus(status) {

    switch (status) {

        case 400:
            return "VALIDATION_ERROR";

        case 401:
            return "INVALID_CREDENTIALS";

        case 403:
            return "ACCOUNT_DISABLED";

        case 404:
            return "NOT_FOUND";

        case 409:
            return "USER_ALREADY_EXISTS";

        case 500:
            return "SERVER_ERROR";

        default:
            return "API_ERROR";

    }

}