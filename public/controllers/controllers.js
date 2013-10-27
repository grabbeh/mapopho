var appModule = angular.module('appModule', []);

appModule.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/', {
            templateUrl: '/partials/home.html',
            controller: 'homeController'
        }).
        otherwise({
            redirectTo: '/'
    });
}]);

appModule
    .controller('homeController', ['$scope', '$http', 
        function ($scope, $http) {
            $scope.tag = "";
            $scope.loading = false;
            $scope.requestTwoPhotos = function(){
                $scope.photos = false;
                $scope.loading = true;
                console.log("Func called");
                var postdata = {
                    tag: $scope.tag
                }
                $http.post('/flickrapi', postdata)
                   .success(function(data){
                      $scope.loading = false;
                      console.log(data);
                      $scope.photos = data;
                })

            }
        }])



