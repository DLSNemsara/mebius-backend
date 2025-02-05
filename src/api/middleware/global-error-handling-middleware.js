const globalErrorHandlingMiddleware = (error, req, res, next) => {
    console.log(error);
    if (error.name === "NotFoundError") {
        res.status(404).json({message: error.message}).send();
    } else {
        res.status(500).json({message: "Internal Server Error"}).send();
    }
};

export default globalErrorHandlingMiddleware;