const { verifySignUp } = require("../middleware");
const controller = require("../controllers/auth.controller");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'uploads'); 
  },
  filename: function (req, file, callback) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    callback(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') cb(null, true);
  else cb(new Error('Invalid file type, only JPEG and PNG is allowed!'), false);
}

const upload = multer({ storage, fileFilter })

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

  app.post("/api/auth/login", controller.signin);

  app.post("/api/auth/signout", controller.signout);
  app.put("/api/auth/reset-password", controller.resetPassword);
  app.post("/api/auth/upload-profile", upload.single('image'), controller.uploadProfile);
  app.get("/api/auth/get-profile/:id", controller.getImage);
};
