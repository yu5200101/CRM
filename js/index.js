let PageRender = (function () {

    let $box = $('#box'),
        $list = $('#list'),
        $pageBtn = $('#page'),
        $pageNum = $('#pageNum'),
        $pageInput = $('#pageInput'),
        $submit = $('#submit');
    let totalPage = 0;//=>总页数
    let page = 1;//=>当前页
    //=>发送请求并绑定数据的函数
    function bindHTML() {
        $.ajax({
            url: '/userList?page=' + page,
            type: 'get',
            async: false,
            dataType: 'json',
            success: bindData
        });
    }

    function bindData(res) {
        totalPage = Math.ceil(res.total / 10);
        let data = res.data;
        if (data) {
            let str = ``;
            $.each(data, (index, item) => {
                str += `<li id="li${item.id}">
            <span>${item.id}</span>
            <span>${item.name}</span>
            <span>${item.age}</span>
            <span>${item.sex === 0 ? '男' : '女'}</span>
            <span>
                <button class="del" data-id="${item.id}">删除</button>
                <button class="check" data-id="${item.id}">查看/修改</button>
            </span>
        </li>`;
            });
            $list.html(str);
            //=>绑定页码
            let str2 = ``;
            for (let i = 1; i <= totalPage; i++) {
                if (i === page) {
                    str2 += `<li class="bg">${i}</li>`;
                    continue;
                }
                str2 += `<li>${i}</li>`
            }
            $pageNum.html(str2);
            //=>输入框的内容对应
            $pageInput.val(page);
        }
    }

    /* $del=$('.del')
     $chech = $('.check')*/

    //=>给页码绑定事件的函数
    function changePage() {
        //=>this->li,span
        if (this.innerHTML === "首页") {
            if (page === 1) return;
            page = 1;
        }
        if (this.innerHTML === "上一页") {
            if (page === 1) return;
            page--;
        }
        if (this.innerHTML === "下一页") {
            if (page === totalPage) return;
            page++;
        }
        if (this.innerHTML === "尾页") {
            if (page === totalPage) return;
            page = totalPage;
        }
        if (this.tagName === 'LI') {
            //=>如果你点击的还是当前页码后面不需要执行了，直接return
            if (page === parseInt(this.innerHTML)) return;
            page = parseInt(this.innerHTML);
        }
        bindHTML();
    }

    //=>给输出框绑定事件
    function inputChangePage(e) {
//=>当敲回车键把page变成输入框中的内容
        if (e.keyCode === 13) {
            let val = Math.round(this.value);
            if (isNaN(val)) {
                this.val = page;
                return;
            }
            //=>处理内容超过范围了的值
            val < 1 ? val = 1 : null;
            val > totalPage ? val = totalPage : null;
            page = val;
            bindHTML();
        }
    }

    //=>给删除按钮绑定事件的函数
    function removeUser() {
        //=>获取当前用户的Id值
        let userID = $(this).attr('data-id');
        //=>询问弹窗
        let isRem = confirm("Are you sure remove this user?");
        if (isRem) {
            //=>只有点击确定才发请求
            $.ajax({
                url: '/removeUser?id=' + userID,
                type: 'get',
                dataType: 'json',
                success: (res) => {
                    if (res.data) {
                        //=>在页面上将这个li移除即可
                        $list[0].removeChild(this.parentNode.parentNode);
                    } else {
                        alert("sorry,can't delete");
                    }
                }
            });
        }
    }

    //=>绑定查看事件的函数
    function checkUser() {
        //=>带参数跳转页面
        //=>首先获取当前用户的id
        let userID = $(this).attr('data-id');
        //=>跳转页面
        window.open('./page/userInfo.html?id=' + userID);
    }

    //=>增加用户的事件函数
    function addUser() {
        let str3 = decodeURIComponent($('#form1').serialize());
        str3 = str3.replace("sex=男&","sex=0&").replace("sex=女&","sex=1&");
        $.ajax({
            url: '/addUser',
            type: 'post',
            dataType: 'json',
            data:str3,
            async: false,
            cache: false,//=>不走缓存
            success: function (res) {
                alert(res.message);
            }
        });
    }

    return {
        init() {
            //=>1、刚打开页面的时候先发一次请求，绑定一下数据
            bindHTML();
            //=>2、给pageBtn下面的页码绑定事件
            $pageBtn.on('click', 'li,span', changePage);
            //=>3、给输入框绑定事件
            $pageInput.on('keyup', inputChangePage);
            //=>4、删除事件
            $list.on('click', '.del', removeUser);
            //=>5、查看事件
            $list.on('click', '.check', checkUser);
            //=>6、绑定增加用户的事件
            $submit.click(addUser);
        }
    }
})();
PageRender.init();