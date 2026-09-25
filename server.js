const bodyParser = require("body-parser")
const { default: mongoose } = require("mongoose")
cors = require("cors")


express = require("express")

app = express()

app.listen(8080, () => {
    console.log("backend start")
})

// cors-------------
app.use(cors())




// bodyparser-----------------
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())

mongoose.connect("mongodb://shyam:86Shyam2004@ac-gnvigvq-shard-00-00.i3koajm.mongodb.net:27017,ac-gnvigvq-shard-00-01.i3koajm.mongodb.net:27017,ac-gnvigvq-shard-00-02.i3koajm.mongodb.net:27017/freshcart?ssl=true&replicaSet=atlas-12agm2-shard-0&authSource=admin&appName=Cluster0&compressors=zlib").then(() => console.log("Database Connected"))

// schema--------------------


const myusers = require("./model/Signup")
const mycategory = require("./model/Addcategory")
const myproducts = require("./model/Addproduct")

const myaddress = require("./model/Address");

const mycart = require("./model/Cart");


//  signup------------------

app.post("/signup", async (req, res) => {
    let b = req.body.alldata
    let a = await myusers.insertOne({
        "firstname": b.firstname,
        "lastname": b.lastname,
        "email": b.email,
        "password": b.password
    })


    let result = await a.save()
    if (result) {
        res.json({
            status: true
        })
    }
    else {
        res.json({
            status: false
        })
    }
})


// signin ------------------------------




app.post("/signin", async (req, res) => {
    let b = req.body.signindata
    let a = await myusers.findOne({
        "email": b.email,
        "password": b.password
    })

    if (a) {

        res.json({
            status: true,
            user: a
        })
    }
    else {
        res.json({
            status: false
        })
    }
})

// user update --------------
app.post("/updateuser", async (req, res) => {

    let b = req.body.userdata;


    let emailExists = await myusers.findOne({
        email: b.email,
        _id: { $ne: b._id }
    });

    if (emailExists) {
        return res.json({
            status: false,

        });
    }

    let result = await myusers.findByIdAndUpdate(
        b._id,
        {
            firstname: b.firstname,
            lastname: b.lastname,
            email: b.email,
            phone: b.phone
        },
        { new: true }
    );

    if (result) {
        res.json({
            status: true,
            user: result
        });
    } else {
        res.json({
            status: false
        });
    }
});

// password update -------------------
app.post("/updatepassword", async (req, res) => {

    let data = req.body;

    let user = await myusers.findOne({
        _id: data.id,
        password: data.currentPassword
    });
    if (!user) {

        return res.json({

            status: false,

            msg: "Current password incorrect"

        });

    }

    await myusers.findByIdAndUpdate(

        data.id,

        {

            password: data.newPassword

        }

    );

    res.json({

        status: true

    });

});

// Delete Logged In User
app.post("/deleteaccount", async (req, res) => {


    let result = await myusers.findOneAndDelete({
        "_id": req.body._id
    });

    if (result) {
        res.json({
            status: true
        });
    } else {
        res.json({
            status: false
        });
    }



})



// all users/ Customers  :------------
app.get("/allusers", async (req, res) => {
    let a = await myusers.find().sort({ _id: -1 });
    if (a) {
        res.json({
            status: true,
            myallusers: a
        })
    }
    else {
        res.json({
            status: false
        })
    }

})


// forgetpassword--------------------


app.post("/forgetpass", async (req, res) => {
    let a = await myusers.findOneAndUpdate({ "email": req.body.forgetpass.email }, { $set: { "password": req.body.forgetpass.password } })
    if (a) {
        res.json({
            status: true,
            myallusers: a
        })
    }
    else {
        res.json({
            status: false
        })
    }
})


// Category page ------------------------
app.post("/category", async (req, res) => {
    let b = req.body.categoryvalue
    let a = await mycategory.insertOne({
        image: b.image,
        categoryName: b.categoryName,
        slug: b.slug,
        date: b.date,
        Description: b.Description,
        Category: b.Category,
        status: b.status,
        metaTitle: b.metaTitle,
        MetaDescription: b.MetaDescription,
    })


    let result = await a.save()
    if (result) {
        res.json({
            status: true
        })
    }
    else {
        res.json({
            status: false
        })
    }
})

app.get("/AllCategory", async (req, res) => {
    let a = await mycategory.find().sort({ _id: -1 });

    if (a) {
        res.json({
            status: true,
            myallcategory: a
        })
    }
    else {
        res.json({
            status: false
        })
    }

})



// product page -------------------------------
app.post("/product", async (req, res) => {
    let b = req.body.productvalue
    let a = await myproducts.insertOne({
        Title: b.Title,
        Category: b.Category,
        Weight: b.Weight,
        Unit: b.Unit,
        image: b.image,
        Description: b.Description,
        ProductCode: b.ProductCode,
        ProductSKU: b.ProductSKU,
        status: b.status,
        RegularPrice: b.RegularPrice,
        SalePrice: b.SalePrice,
        MetaTitle: b.MetaTitle,
        MetaDescription: b.MetaDescription,
        vendorId: b.vendorId,

        vendorName: b.vendorName
    })


    let result = await a.save()
    if (result) {
        res.json({
            status: true
        })
    }
    else {
        res.json({
            status: false
        })
    }

})
app.get("/allproduct", async (req, res) => {

    let a = await myproducts.find().sort({ _id: -1 });

    if (a) {
        res.json({
            status: true,
            myallproduct: a
        });
    } else {
        res.json({
            status: false
        });
    }

});

// update product --------------

app.post("/updateproduct", async (req, res) => {

    let b = req.body.productvalue


    let result = await myproducts.findByIdAndUpdate(
        b._id,
        {
            Title: b.Title,
            Category: b.Category,
            Weight: b.Weight,
            Unit: b.Unit,
            image: b.image,
            Description: b.Description,
            ProductCode: b.ProductCode,
            ProductSKU: b.ProductSKU,
            status: b.status,
            RegularPrice: b.RegularPrice,
            SalePrice: b.SalePrice,
            MetaTitle: b.MetaTitle,
            MetaDescription: b.MetaDescription,
            vendorId: b.vendorId,

            vendorName: b.vendorName
        }
    );

    if (result) {
        res.json({ status: true });
    } else {
        res.json({ status: false });
    }
});

// category update 

app.post("/updatecategory", async (req, res) => {

    let b = req.body.categoryvalue

    let result = await mycategory.findOneAndUpdate(
        { "_id": b._id }, {
        $set:
        {
            image: b.image,
            categoryName: b.categoryName,
            slug: b.slug,
            date: b.date,
            Description: b.Description,
            Category: b.Category,
            status: b.status,
            metaTitle: b.metaTitle,
            MetaDescription: b.MetaDescription
        }
    }
    );

    if (result) {
        res.json({
            status: true
        });
    } else {
        res.json({
            status: false
        });
    }

});



// delete product =========
app.post("/deleteproduct", async (req, res) => {
    let result = await myproducts.findOneAndDelete({ "_id": req.body.dltpro._id })
    if (result) {
        res.json({
            status: true
        })
    }
    else {
        res.json({
            status: false
        })
    }
})


// delete category---------------------
app.post("/deletecategory", async (req, res) => {
    let result = await mycategory.findOneAndDelete({ "_id": req.body.dltcat._id })
    if (result) {
        res.json({
            status: true
        })
    }
    else {
        res.json({
            status: false
        })
    }
})


// delete customer ______________________=--------

app.post("/deletecustomer", async (req, res) => {
    let result = await myusers.findOneAndDelete({ "_id": req.body.dltcus._id })
    if (result) {
        res.json({
            status: true
        })
    }
    else {
        res.json({
            status: false
        })
    }
})


// address-------------------
app.post("/addaddress", async (req, res) => {

    let b = req.body.addressdata;

    let result = await myaddress.insertOne({

        userid: b.userid,

        FirstName: b.FirstName,

        LastName: b.LastName,

        AddressLine1: b.AddressLine1,

        AddressLine2: b.AddressLine2,

        City: b.City,

        Country: b.Country,

        State: b.State,

        ZipCode: b.ZipCode,

        BusinessName: b.BusinessName,

        IsDefault: b.IsDefault

    });

    let save = await result.save();

    if (save) {

        res.json({
            status: true
        });

    } else {

        res.json({
            status: false
        });

    }

});

app.post("/getaddress", async (req, res) => {

    let result = await myaddress.find({

        userid: req.body.userId

    });

    if (result) {

        res.json({

            status: true,

            addresses: result

        });

    }
    else {

        res.json({

            status: false

        });

    }

});


app.post("/setdefaultaddress", async (req, res) => {

    await myaddress.updateMany(

        { userid: req.body.userId },

        {

            $set: {

                IsDefault: false

            }

        }

    );

    await myaddress.findByIdAndUpdate(

        req.body.addressId,

        {

            IsDefault: true

        }

    );

    res.json({

        status: true

    });

});


// delete address ----------------

app.post("/deleteaddress", async (req, res) => {

    let result = await myaddress.findOneAndDelete({

        _id: req.body._id

    });

    if (result) {

        res.json({

            status: true

        });

    }
    else {

        res.json({

            status: false

        });

    }

});


//add to cart ---------------------------------
// Add To Cart
app.post("/addtocart", async (req, res) => {
    try {
        let product = req.body;

        // ✅ Check by productId + email/userId
        let already = await mycart.findOne({
            productId: product._id,
            email: product.email // Ensure email is sent from frontend
        });

        if (already) {
            return res.json({
                status: false,
                message: "Already Added"
            });
        }

        let cart = new mycart({
            productId: product._id,
            email: product.email,
            Title: product.Title,
            Category: product.Category,
            image: product.image,
            Weight: product.Weight,
            SalePrice: product.SalePrice,
            RegularPrice: product.RegularPrice,
            quantity: 1
        });

        await cart.save();

        res.json({ status: true });
    } catch (err) {
        res.json({ status: false, message: err.message });
    }
});


app.get("/cart", async (req, res) => {

    let data = await mycart.find();

    res.json({

        status: true,

        mycart: data

    });

});

app.post("/deleteshopcart", async (req, res) => {
    try {
        let result = await mycart.findOneAndDelete({
            _id: req.body._id,
        });

        if (result) {
            res.json({
                status: true,
                message: "Product removed from cart",
            });
        } else {
            res.json({
                status: false,
                message: "Product not found",
            });
        }
    } catch (err) {
        res.json({
            status: false,
            message: err.message,
        });
    }
});

// Wishlist Page ------------------
const mywishlist = require("./model/Wishlist");

// Add to Wishlist
app.post("/addwishlist", async (req, res) => {
    try {
        let product = req.body;

        // ✅ FIX: email aur productId DONO se check karein
        let already = await mywishlist.findOne({
            productId: product._id,
            email: product.email
        });

        if (already) {
            return res.json({
                status: false,
                msg: "Already Added"
            });
        }

        // ✅ FIX: Standard Mongoose creation method
        let wishlist = new mywishlist({
            productId: product._id,
            Title: product.Title,
            Category: product.Category,
            Weight: product.Weight,
            image: product.image,
            SalePrice: product.SalePrice,
            RegularPrice: product.RegularPrice,
            email: product.email,
            status: product.status
        });

        await wishlist.save();

        res.json({
            status: true
        });
    } catch (err) {
        res.json({
            status: false,
            msg: err.message
        });
    }
});

// Get User Specific Wishlist
app.post("/wishlist", async (req, res) => {
    try {
        let result = await mywishlist.find({ email: req.body.email });
        res.json({
            status: true,
            mywishlist: result
        });
    } catch (err) {
        res.json({
            status: false,
            msg: err.message
        });
    }
});

// Delete Wishlist Item
app.post("/deletewishlist", async (req, res) => {
    try {
        let result = await mywishlist.findOneAndDelete({
            _id: req.body._id,
            email: req.body.email
        });

        if (result) {
            res.json({ status: true });
        } else {
            res.json({ status: false });
        }
    } catch (err) {
        res.json({ status: false });
    }
});

// ✅ FIX: Wishlist Count (Filtered by User Email)
app.post("/wishlistcount", async (req, res) => {
    try {
        let count = await mywishlist.countDocuments({ email: req.body.email });
        res.json({
            status: true,
            count: count
        });
    } catch (err) {
        res.json({ status: false, count: 0 });
    }
});
// navbar----------------------------

// cart count
app.get("/cartcount", async (req, res) => {
    let count = await mycart.countDocuments();

    res.json({
        status: true,
        count: count
    });
});


// Reviews---------------------------------------------
const myreview = require("./model/Review");


app.post("/addreview", async (req, res) => {

    try {

        let b = req.body;

        let product = await myproducts.findById(b.productId);


        let a = await myreview.insertOne({

            productId: b.productId,

            productName: product ? product.Title : "Unknown Product",

            name: b.name,

            email: b.email,

            rating: Number(b.rating),

            review: b.review

        });


        let result = await a.save();


        res.json({

            status: true

        });


    }
    catch (err) {

        console.log(err);

        res.json({

            status: false,

            error: err.message

        });

    }

});

app.post("/getreview", async (req, res) => {

    let result = await myreview.find({

        productId: req.body.productId

    });

    if (result) {

        res.json({

            status: true,

            myreview: result

        });

    }

    else {

        res.json({

            status: false

        });

    }

});

// delete review ------------------

app.post("/deletereview", async (req, res) => {

    let id = req.body.id;

    let result = await myreview.findOneAndDelete(

        { "_id": id }

    );

    if (result) {

        res.json({
            status: true
        });

    } else {

        res.json({
            status: false
        });

    }

});

// update review -----------------------------------------
app.post("/updatereview", async (req, res) => {

    let b = req.body;

    let result = await myreview.findOneAndUpdate(

        { "_id": b._id },

        {
            $set: {

                name: b.name,
                email: b.email,
                rating: b.rating,
                review: b.review

            }

        }

    );

    if (result) {

        res.json({
            status: true
        });

    } else {

        res.json({
            status: false
        });

    }

});


// dashboard all reviews --------------------------

app.get("/allreviews", async (req, res) => {

    let a = await myreview.find().sort({ _id: -1 });

    if (a) {

        res.json({

            status: true,

            myallreviews: a

        });

    }
    else {

        res.json({

            status: false

        });

    }

});

// add payment ---------------------

const mypayment = require("./model/Payment");

app.post("/addpayment", async (req, res) => {

    let b = req.body;

    let result = await mypayment.insertOne({

        userId: b.userId,

        cardType: b.cardType,

        cardName: b.cardName,

        cardNumber: b.cardNumber,

        month: b.month,

        year: b.year,

        cvv: b.cvv

    });

    await result.save();

    res.json({
        status: true
    });

});


app.post("/getpayment", async (req, res) => {

    let result = await mypayment.find({

        userId: req.body.userId

    });

    res.json({

        status: true,

        payment: result

    });

});


app.post("/deletepayment", async (req, res) => {

    let result = await mypayment.findOneAndDelete({

        _id: req.body._id

    });

    if (result) {

        res.json({
            status: true
        });

    }
    else {

        res.json({
            status: false
        });

    }

});


// your order page------------------
const myorder = require("./model/Order");


// Add Order
app.post("/addorder", async (req, res) => {
    //  console.log(req.body.products);

    let result = await myorder.insertMany(req.body.products);

    if (result) {

        await mycart.deleteMany({});

        res.json({
            status: true
        });

    }
    else {

        res.json({
            status: false
        });

    }

});


// Admin Order List (All Orders)
app.get("/orders", async (req, res) => {

    let result = await myorder.find().sort({ _id: -1 });


    if (result) {

        res.json({

            status: true,

            myorders: result

        });

    }
    else {

        res.json({

            status: false

        });

    }

});


// User Orders (Only Logged In User)
app.post("/myorders", async (req, res) => {

    let result = await myorder.find({

        userId: req.body.userId

    });

    if (result) {

        res.json({

            status: true,

            myorders: result

        });

    } else {

        res.json({

            status: false

        });

    }

});


// single order list -----------------
app.post("/ordersingle", async (req, res) => {

    let result = await myorder.find({

        orderNo: req.body.orderNo

    });

    if (result) {

        res.json({

            status: true,

            order: result

        });

    }

    else {

        res.json({

            status: false

        });

    }

});

// update order status----------
app.post("/updateorderstatus", async (req, res) => {

    let result = await myorder.updateMany(

        {
            orderNo: req.body.orderNo
        },

        {
            $set: {
                status: req.body.status
            }
        }

    );

    if (result) {

        res.json({
            status: true
        });

    }
    else {

        res.json({
            status: false
        });

    }

});

// vendor / seller -----------------------

const Vendor = require("./model/Vendor");

// Add Vendor ----------------------------

app.post("/addvendor", async (req, res) => {

    let b = req.body.vendorvalue;

    let a = await Vendor.insertOne({

        vendorName: b.vendorName,

        sellerId: b.sellerId,

        email: b.email,

        phone: b.phone,

        address: b.address,

        image: b.image

    });

    let result = await a.save();

    if (result) {

        res.json({

            status: true

        });

    }
    else {

        res.json({

            status: false

        });

    }

});

// All Vendors --------------------------

app.get("/allvendor", async (req, res) => {

    let a = await Vendor.find();

    if (a) {

        res.json({

            status: true,

            myallvendor: a

        });

    }

    else {

        res.json({

            status: false

        });

    }

});


app.get("/vendordashboard", async (req, res) => {

    let vendors = await Vendor.find();

    let data = [];

    for (let vendor of vendors) {

        // Vendor ke products
        let products = await myproducts.find({
            vendorId: vendor._id.toString()
        });

        let productIds = products.map((item) => item._id.toString());

        // Vendor ke orders
        let orders = await myorder.find({
            productId: { $in: productIds }
        });

        let grossSale = 0;

        orders.forEach((item) => {

            grossSale += Number(item.SalePrice) * Number(item.quantity);

        });

        let earning = Number((grossSale * 0.80).toFixed(2)); // 80% Vendor

        data.push({

            _id: vendor._id,

            vendorName: vendor.vendorName,

            sellerId: vendor.sellerId,

            email: vendor.email,

            phone: vendor.phone,

            address: vendor.address,

            image: vendor.image,

            totalProducts: products.length,

            totalOrders: orders.length,

            grossSale: grossSale,

            earning: earning

        });

    }

    res.json({

        status: true,

        vendors: data

    });

});


app.post("/vendorbyid", async (req, res) => {

    let vendor = await Vendor.findById(req.body.vendorId);

    if (vendor) {

        res.json({
            status: true,
            vendor: vendor
        });

    } else {

        res.json({
            status: false
        });

    }

});


// delete vendor ---------------
app.post("/deletevendor", async (req, res) => {

    try {

        const { id } = req.body;

        const vendor = await Vendor.findByIdAndDelete(id);

        if (vendor) {

            res.send({
                status: true,
                message: "Vendor deleted successfully"
            });

        }
        else {

            res.send({
                status: false,
                message: "Vendor not found"
            });

        }


    } catch (err) {

        res.send({
            status: false,
            message: err.message
        });

    }

});

// search product -----------------

app.get("/searchproduct", async (req, res) => {
    try {

        let keyword = req.query.keyword || "";

        let products = await myproducts.find({
            Title: {
                $regex: keyword,
                $options: "i"   // case insensitive
            }
        });

        res.json({
            status: true,
            products: products
        });

    } catch (err) {

        res.json({
            status: false,
            message: err.message
        });

    }
});

// upload ----------------------

app.get("/", (req, res) => {
    res.json({
        status: true
    })
})