let http = require('http'),
    url = require('url'),
    fs = require('fs');
http.createServer((request, response) => {
    let {pathname, query} = url.parse(request.url, true);
    let status = null;

    function getData(data) {
        let reg = /([^#$&?]+)=([^#$&?]+)/g;
        let obj = {};
        data.replace(reg, function () {
            obj[arguments[1]] = arguments[2];
        });
        data = obj;
        return data;
    }

    if (pathname === '/') {
        fs.readFile('./userList.html', 'utf-8', (error, value) => {
            if (error) {
                console.log(error);
                response.end(error);
            } else {
                response.end(value);
            }
            return;
        });
    }
    //=>处理资源文件
    let reg = /\.[a-zA-Z0-9]+$/i;
    if (reg.test(pathname)) {
        if (/\.(html|js|css)$/i.test(pathname)) {
            fs.readFile('.' + pathname, 'utf-8', (error, value) => {
                if (error) {
                    response.end('not found');
                } else {
                    response.end(value);
                }
            });
        } else {
            fs.readFile('.' + pathname, (error, value) => {
                if (error) {
                    response.end('not found');
                } else {
                    response.end(value);
                }
            });
        }
    }
    //=>处理API/userList
    let result = {
        message: 'error',
        code: 0,
        data: [],
    };
    let allUserData = JSON.parse(fs.readFileSync('./data/userListData.json', 'utf-8'));
    if (pathname === '/userList') {
        //=>获取客户端参数page的值
        let page = query.page || 1;
        //=>1-> 0-9
        //=>2->10-19
        //=>page->(page-1)*10 - (page*10-1)
        result = {
            message: 'success',
            code: 1,
            total: allUserData.length,
            //=>slice不包括后面的索引，所以不需要减1
            data: allUserData.slice((page - 1) * 10, page * 10),
        };
        //=>重写响应头，增加一些信息
        response.writeHead(200, {
            'Content-type': 'text/json;charset=utf-8'
        });
        response.end(JSON.stringify(result));
        return;
    }
    //=>处理移除用户 API/removeUser
    if (pathname === '/removeUser') {
        //=>获取客户端传过来的删除用户的ID，就是参数ID的值
        let userID = query.id;
        //=>遍历数据库中的数据，将这个id编号是userID的用户信息删除
        allUserData = allUserData.filter((item) => item.id != userID);
        //=>将删除后的数组写入到数据库
        fs.writeFile('./data/userListData.json', JSON.stringify(allUserData), 'utf-8', (e) => {
            if (e) {
                result = {
                    message: 'error',
                    data: false,
                    code: 0
                };
                status = 404;
            } else {
                result = {
                    message: 'success',
                    data: true,
                    code: 1
                };
                status = 200;
            }
            response.writeHead(status, {
                'Content-type': 'text/json;charset=utf-8'
            });
            response.end(JSON.stringify(result));
        });
    }
    //=>处理添加用户 APIaddUser
    if (pathname === '/addUser') {
        //=>post请求
        let data = '';
        request.on('data', (chunk) => {
            data += chunk;
            //=>一点点接收它的内容使用chunk分块传输方式
        });
        request.on('end', () => {
            data = getData(data);
            //=>给这条数据加一个用户编号
            data['id'] = allUserData[allUserData.length - 1].id + 1;
            //=>将这条数据push到数据库中
            allUserData.push(data);

            fs.writeFile('./data/userListData.json', JSON.stringify(allUserData), 'utf-8', (e) => {
                if (e) {
                    result = {
                        message: 'error',
                        code: 0,
                        data: false
                    };
                    status = 404;
                } else {
                    result = {
                        message: 'success',
                        code: 1,
                        data: true
                    };
                    status = 200;
                }
                response.writeHead(status, {
                    "Content-type": "text/json;charset=utf-8"
                });
                response.end(JSON.stringify(result));
            });
        });
        return;
    }
    //=>处理查看用户信息 api/checkUser
    if (pathname === '/checkUser') {
        //=>获取客户端传过来查看用户的ID
        let userID = query.id;
        //=>根据userID去数据库中查找相应的信息
        let data = allUserData.find(item =>
            item.id == userID
        );
        result = {
            message: 'success',
            code: 1,
            data: data
        };
        response.writeHead(200, {
            "Content-type": "text/json;charset=utf-8"
        });
        response.end(JSON.stringify(result));
        return;
    }
    //=>处理修改用户信息API/changeUserInfo
    if (pathname === '/changeUserInfo') {
        let data = '';
        request.on('data', (chunk) => {
            data += chunk;
        });
        request.on('end', () => {
            data = getData(data);
            //=>替换原来alluserData数组中对应的ID编号的那一项
            let index = allUserData.findIndex(item => item.id == data.id);
            allUserData.splice(index, 1, data);
            fs.writeFileSync('./data/userListData.json', JSON.stringify(allUserData), 'utf-8');
            result = {
                message: 'success',
                code: 1,
                data: true
            };
            response.writeHead(200, {
                "Content-type": "text/json;charset=utf-8"
            });
            response.end(JSON.stringify(result));
        });
        return;
    }
    //=>处理查询API/searchUser
    if (pathname === '/searchUser') {
        let {getFor, getCon} = query;
        let reg = new RegExp(getCon, 'g');
        let data = allUserData.filter(item => reg.test(item[getFor].toString()));
        result = {
            message: 'success',
            code: 1,
            total: data.length,
            data: data
        };
        response.writeHead(200, {
            "Content-type": "text/json;charset=utf-8"
        });

        response.end(JSON.stringify(result));
        return;
    }
}).listen(12345, () => {
    console.log(`http://localhost:12345`);
});