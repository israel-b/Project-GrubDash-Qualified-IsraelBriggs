const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// Middleware function to validate the request body
function bodyDataHas(propertyName){
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Dish must include a ${propertyName}`
        });
    };
}

function priceIsValid(req, res, next){
    const { data: { price } = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        });
    }
    next();
}

function validateDishId(req, res, next){
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish){
        res.locals.dish = foundDish;
        return next();
    };
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    });
};

function validateDishIdUpdate(req, res, next){
    const { dishId } = req.params;
    const { data: { id } = {}} = req.body;
    if(req.body.data.id){
        if(id != dishId) {
            return next({
                status: 400,
                message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
            });
        };
    }
    
    next();
}

// List all dishes
const list = (req, res) => {
    res.json({ data: dishes });
};

// Create dishes
const create = (req, res) => {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
};

// Read single dish
const read = (req, res) => {
    res.json({ data: res.locals.dish });
}

const update = (req, res) => {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const foundDish = res.locals.dish;
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;
    
    res.json({ data: foundDish});
}

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValid,
        create
    ],
    read: [validateDishId, read],
    update: [
        validateDishId, 
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValid,
        validateDishIdUpdate,
        update
    ],
        list,
};