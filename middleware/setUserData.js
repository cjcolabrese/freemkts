module.exports = (req, res, next) => {
    if (req.user) {
      res.locals.userData = {
        id: req.user._id,
        displayName: req.user.displayName,
        firstName: req.user.firstName,
        lasName: req.user.lastName,
        image: req.user.image,
      };
    }
    next();
  };