const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// Middleware function to validate the request body
function bodyDataHas(propertyName){
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Order must include a ${propertyName}`
        });
    };
}

function validateDishesProperty(req, res, next){
    const { data: { dishes } = {} } = req.body;
    if(!Array.isArray(dishes) || dishes.length <= 0){
        return next({
            status: 400,
            message: `Order must include at least one dish`
        });
    };
    next();
};

function validateDishQuantity(req, res, next){
    const { data: { dishes } = {}} = req.body;
    dishes.forEach((dish, index) => {
        if(!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)){
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
    });
    next();
}

function validateOrderId(req, res, next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order does not exist: ${orderId}.`
    });
}

function validateOrderIdUpdate(req, res, next){
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if(req.body.data.id){
        if(id != orderId) {
            return next({
                status: 404,
                message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
            })
        }
    }
    next();
};

function validateStatusProperty(req, res, next){
    const { data: { status } = {}} = req.body;
    if(!req.body.data.status){
        return next({
            status: 404,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered.`
        });
    } else if( status === "delievered"){
        return next({
            status: 404,
            message: `A delivered order cannot be changed`
        });
    };
    next();
}

function validateDeleteOrderStatus(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder.status !== "pending"){
        return next({
            status: 400,
            message: `An order cannot be deleted unless it is pending. Returns a 400 status code`
        });
    }
    next();
}

const list = (req, res) => {
    res.json({ data: orders });
}

// Create orders
const create = (req, res) => {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
};

const read = (req, res) => {
    res.json({ data: res.locals.order });
};

const update = (req, res) => {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const foundOrder = res.locals.order;
    foundOrder.deliverTo = deliverTo;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.status = status;
    foundOrder.dishes = dishes;

    res.json({ data: foundOrder });
};

const destroy = (req, res) => {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("status"),
        bodyDataHas("dishes"),
        validateDishesProperty,
        validateDishQuantity,
        create
    ],
    read: [validateOrderId, read],
    update: [
        validateOrderId,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        //bodyDataHas("status"),
        bodyDataHas("dishes"),
        validateDishesProperty,
        validateDishQuantity,
        validateOrderIdUpdate,
        validateStatusProperty,
        update
    ],
    delete: [validateOrderId, validateDeleteOrderStatus, destroy],
    list,
};