const { Client } = require("pg");
var express = require("express");

var app = express();
app.use(express.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Methods",
        "GET,OPTIONS,PATCH,PUT,DELETE,HEAD,POST"
    );
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

const port = 2410;
app.listen(port, () => console.log(`Node App listening on port ${port}!`));
const client = new Client({
    user: "postgres",
    password: "parashar1308@",
    database: "postgres",
    port: 5432,
    host: "db.egbxqudebiyhrwmeipkz.supabase.co",
    ssl: { rejectUnauthorized: false },

});
client.connect(function (res, error) {
    console.log("Connected!!!");
})
app.get("/resetData1", function (req, res, next) {
    var format = require('pg-format');
    let { data } = require("./task8Data.js");
    let { purchases } = data;
    // console.log(purchases);
    let purData = purchases.map(ele => {
        return [ele.shopId, ele.productid, ele.quantity, ele.price];
    });
    let query = 'INSERT INTO purchases (shopid, productid, quantity, price) VALUES %L';
    // console.log(purData);
    client.query(format(query, purData), [], (err, result) => {
        console.log(err);
        console.log('1', result);
    });

});
app.get("/shops", function (req, res, next) {
    const query = "SELECT * from shops";
    console.log('in');
    client.query(query, function (err, result) {
        console.log(query);
        if (err) { res.status(400).send(err); }
        res.send(result);
    });
});

app.post("/shops", function (req, res, next) {
    let values = Object.values(req.body);
    console.log("inside /users get api");
    const query = `insert into shops (name, rent) values($1, $2)`;
    client.query(query, values, function (err, result) {
        console.log(query);
        if (err) { res.status(400).send(err); }
        res.send(result);

    });
});
app.get("/products", function (req, res, next) {
    const query = "SELECT * from products";
    client.query(query, function (err, result) {
        console.log(query);
        if (err) { res.status(400).send(err); }
        res.send(result);
    });
});
app.post("/products", function (req, res, next) {
    console.log("inside /users post api");
    var values = Object.values(req.body);
    console.log(values);
    const query = `insert into products (productname, category, description) values($1, $2, $3)`;
    client.query(query, values, function (err, result) {
        if (err) res.status(400).send(err);
        else {
            res.send(`${result.rowCount} insertion successful`);

        }
    });
});
app.get("/products/:id", function (req, res, next) {
    let id = (+req.params.id);
    const query = `SELECT * from products where productId=$1`;
    client.query(query, [id], function (err, result) {
        console.log(query);
        if (err) { res.status(400).send(err); }
        res.send(result);
    });
});
app.put("/products/:id", function (req, res, next) {
    let body = req.body;
    let id = (+req.params.id);
    var values = [body.productname, body.category, body.description, id];
    console.log(values);
    const query = `update products set productname=$1, category=$2, description=$3 where productId = $4`;
    client.query(query, values, function (err, result) {
        if (err) res.status(400).send(err);
        else {
            res.send(`${result.rowCount} updation successful`);
        }
    });
});


app.get("/shopnames", function (req, res) {
    const query = `SELECT shopid,name from shops`;
    client.query(query, function (err, result) {
        if (err) { res.status(400).send(err); }
        res.send(result);
    });
});
app.get("/prodnames", function (req, res) {
    const query = `SELECT productid,productname from products`;
    client.query(query, function (err, result) {
        if (err) { res.status(400).send(err); }
        res.send(result);
    });
});

app.get("/purchases", function (req, res) {
    let { product, shop, sortBy } = req.query;
    console.log(product, shop);
    let query = "select * from purchases";
    
    if (product || shop) {
        query += " WHERE";
        const conditions = [];
        if (product) {
            conditions.push(" productid = ANY($1::int[])");
        }
        if (shop) {
            product?conditions.push(" shopid=$2"):
            conditions.push(" shopid=$1");
        }

        query += conditions.join(" AND");
    }
    if (sortBy) {
        if (sortBy === 'QtyAsc')
            query = query + ` order by quantity asc`;
        if (sortBy === 'QtyDesc')
            query = query + ` order by quantity desc`;
        if (sortBy === 'ValueAsc')
            query = query + ` order by quantity*price asc`;
        if (sortBy === 'ValueDesc')
            query = query + ` order by quantity*price desc`;
    }
    const params = [];
    if (product || shop) {
        if (product) {
            let products1 = product.split(',').map(ele => +(ele[2]));
            params.push(products1);
        }
        if (shop) {
            params.push(+(shop[2]));
        }
        console.log(query,params);
        client.query(query, params, function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send(result);
            }
        });
    }
    else {
        client.query(query, function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send(result);
            }
        });
    }

});

app.get("/purchases/shops/:id", function (req, res, next) {
    let id = (+req.params.id);
    const query = `SELECT * from purchases where shopid=$1`;
    client.query(query, [id], function (err, result) {
        if (err) { res.status(400).send(err); }
        res.send(result);
    });
});

app.get("/purchases/products/:id", function (req, res, next) {
    let id = (+req.params.id);
    const query = `SELECT * from purchases where productid=$1`;
    client.query(query, [id], function (err, result) {
        if (err) { res.status(400).send(err); }
        res.send(result);
    });
});
app.get("/totalPurchase/shop/:shopId", function (req, res, next) {
    let shopId = (+req.params.shopId);
    const query = `SELECT shopid,productid,sum(quantity) as quantity,max(price) as price from purchases where shopid=$1 group by productid,shopid`;
    client.query(query, [shopId], function (err, result) {
        if (err) { res.status(400).send(err); }
        res.send(result);
    });
})
app.get("/totalPurchase/product/:prodId2", function (req, res, next) {
    let prodId2 = (+req.params.prodId2);
    const query = `SELECT shopid,productid,sum(quantity) as quantity,max(price) as price from purchases where productid=$1 group by productid,shopid`;
    client.query(query, [prodId2], function (err, result) {
        if (err) { res.status(400).send(err); }
        res.send(result);
    });
});

