module.exports.registerValidation = (username,password) => {
    const errors = [];

    if(username === "")
    {
        errors.push({message : "Please fill the username area"})
    }
    if(password === "")
    {
        errors.push({message: "Please fill the password area"})
    }


    return errors;

}