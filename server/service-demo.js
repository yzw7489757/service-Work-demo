  //同样的方法，监听fetch事件， 
self.addEventListener('fetch', function (event) {
    //respondWith方法产生一个request，response。
    event.respondWith(
      //利用match方法对event.request所请求的文件进行查询
      caches.match(event.request).then(
        function (res) {
          console.log(res, event.request);
          //如果cache中有该文件就返回。
          if (res) {
            return res
          } else {
            //没有找到缓存的文件,再去通过fetch()请求资源
            fetch(res.url).then(function (res) {
              if (res) {
                if (!res || res.status !== 200 || res.type !== 'basic') {
                  return res;
                }
                //再将请求到的数据丢到cache缓存中..
                var fetchRequest = event.request.clone();
                var fileClone = res.clone();
                caches.open('app-v1')
                  .then(function (cache) {
                    cache.put(event.request, fileClone);
                  });
              } else {
                //没有请求到该文件，报错处理
                console.error('file not found:' + event.reuqest + '==>' + res.url)
              }
            })
          }
        }
      )
    );
  });
  
  
  self.addEventListener('install', function (event) {
      var now = Date.now();
      // 事先设置好需要进行更新的文件路径
      var urlsToPrefetch = [
        './index.css',
        './servicework.html'
      ];
      event.waitUntil(

        caches.open(CURRENT_CACHES.prefetch).then(function (cache) {
          var cachePromises = urlsToPrefetch.map(function (urlToPrefetch) {
            // 使用 url 对象进行路由拼接            
            var url = new URL(urlToPrefetch, location.href);
            url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;
            // 创建 request 对象进行流量的获取 
            var request = new Request(url, {
              mode: 'no-cors'
            });
            // 手动发送请求，用来进行文件的更新
            return fetch(request).then(function (response) {
              if (response.status >= 400) {
                // 解决请求失败时的情况     
                throw new Error('request for ' + urlToPrefetch +
                  ' failed with status ' + response.statusText);
              }
              // 将成功后的 response 流，存放在 caches 套件中，完成指定文件的更新。
              return cache.put(urlToPrefetch, response);
            }).catch(function (error) {
              console.error('Not caching ' + urlToPrefetch + ' due to ' + error);
            });
          });
          return Promise.all(cachePromises).then(function () {
            console.log('Pre-fetching complete.');
          });
        }).catch(function (error) { console.error('Pre-fetching failed:', error); }));
    });
