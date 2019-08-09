
    const got = require('@/utils/got');
    const cheerio = require('cheerio');
    const filterExpired = require('@/utils/filter-expired');

    module.exports = async (ctx) => {
        const currentPageno = ctx.params.currentPageno;
        const link = `http://careersys.sufe.edu.cn/pros_jiuye/s/zxh/owebsiteData/position?type=list&eachPageRows=15&currentPageno=${currentPageno}&fbbk=2`;
        const response = await got({
            method: 'get',
            url: link,
            headers: {
                Referer: `http://career.sufe.edu.cn/`,
                UserAgent:` Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.46 Safari/537.36`
            },
            dataType:'jsonp',
            jsonp:'callback'
        });

        const responseObj = JSON.parse((response.data.substring(5, response.data.lastIndexOf(')'))));

        const list = responseObj.listData;

        const result = await Promise.all(
          list
                .filter((i) =>
                    filterExpired(i.sxsj)
                )

                .map(async (item, _) => {

                    const ti = item.yrdwmc + '-' + item.zwmc;

                const link = `http://careersys.sufe.edu.cn/pros_jiuye/s/zxh/owebsiteData/position?wid=${item.wid}&type=input`;
                const response = await got(
                    {
                        method:'get',
                        url:link,
                        dataType:'jsonp',
                        jsonp:'callback',
                        headers:{
                            UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.46 Safari/537.36',
                            Referer: `http://career.sufe.edu.cn/`,

                        }
                    }
                );

                let contentObj = JSON.parse(response.data.substring(5, response.data.lastIndexOf(')')));
                contentObj = contentObj.listData[0];

                let content = '【公司简介】:' + (contentObj.dwjj)
                     + '【专业要求】'  + (contentObj.zdzy)
                     + '【学历要求】' + (contentObj.xlyq)
                     + '【开始时间】' + (contentObj.sxsj)
                     ;


                 contentObj.subOpList.forEach((element) => {
                     const msg =  '【职位类别】' + (element.content)
                     + '【月薪级别】' + (element.field4)
                     + '【需求人数】' + (element.field1)
                     + '【性别要求】' + (element.field6)
                     + '【有效期】' + (element.field2);
                     content = content + msg;
                 });
                 content = content + '【招聘文本】：' + (contentObj.zwms);
                   return {
                        title: ti,
                        link:`http://career.sufe.edu.cn/position.html?wid=${item.wid}&jobtype=2`,
                        guid:_,
                        description: cheerio.load(content)
                        .text()
                        .trim()
                        .replace(/\n\s*\n/g, '\n'),
                    };
                })

        );
        ctx.state.data = {
            title: '上海财经大学学生就业指导服务中心',
            link,
            description: `上海财经大学学生就业指导服务中心 - ${currentPageno}`,
            item: result,
            allowEmpty: true,
        };


};
