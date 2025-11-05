const notFound = (req, res) => {
    res.json({
        message: 'Route not found',
        path: req.originalUrl
    });
};

module.exports = notFound;