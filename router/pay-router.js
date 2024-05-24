const express = require("express")
const router = express.Router();


const { addCostumer ,addNewCard , createCharges  } = require("../controller/pay")


router.post("/pay" ,addCostumer)

router.post("/paycreate" ,addNewCard)
router.post("/done" , createCharges)


// app.get("/" ,(req,res) =>{
//     res.send("")
// })



module.exports = router