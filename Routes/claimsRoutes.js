const express = require('express');
const router = express.Router();
const claimController = require('../Controllers/claimController');
const upload = require('../Middleware/upload');

router.use((req, res, next) => {
  console.log(`[ROUTE-HIT] ${req.method} ${req.originalUrl}`);
  next();
});

 
router.post('/', upload.single('proofFile'), claimController.createClaim);
router.get('/', claimController.getAllClaims);
router.get('/item/:id', claimController.getClaimsByItem);
router.patch('/:id/status', claimController.updateClaimStatus);
 
// router.all('*', (req, res) => {
//   console.log("Unmatched route:", req.method, req.originalUrl);
//   res.status(404).json({ message: 'Route not found in claimsRoutes' });
// });


module.exports = router;