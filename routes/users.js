const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/login", userController.getUserLogin);
router.get("/logout", userController.getUserLogout);
router.get("/register", userController.getUserRegister);
router.post("/login", userController.postUserLogin);
router.post("/register", userController.postUserRegister);
router.get("/admin", userController.getUserLoginAdmin);
router.post("/admin", userController.postAdminAddBook);
router.get("/kitapara", userController.getKitapAra);
router.post("/kitapara", userController.postKitapAra);
router.post("/kitapvarmi", userController.postKitapVarmi);
router.get("/kitapver", userController.getKitapVer);
router.post("/kitapver", userController.postKitapVer);
router.get("/admin2", userController.getTimeLapse);
router.post("/admin2", userController.postTimeLapse);
module.exports = router;
