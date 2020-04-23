module.exports = {
  middlewares: [
    function rewriteIndex(context, next) {
      // console.log(context)
      // if (context.url === 'cesium/Core/Cartesian2') {
      //   console.log('got it')
      //   //context.url = '/src/index.html';
      // }
      return next();
    },
  ],
};
