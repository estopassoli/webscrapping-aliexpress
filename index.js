const pup = require('puppeteer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
moment.locale('pt')
const readline = require('readline');
const url = 'https://aliexpress.com';

(async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Qual o produto que deseja buscar?\n> ', async (searchFor) => {

        console.log('Iniciando scrapping de ' + searchFor + '...');
        const browser = await pup.launch({
            headless: true,
            slowMo: 200,
          });
        const page = await browser.newPage();
        await page.setViewport({
            width: 1366,
            height: 768
        });

        await page.goto(url);

        await page.waitForSelector('#search-key');
        await page.type('#search-key', searchFor);
        await page.keyboard.press('Enter');
        await page.waitForNavigation()
        await autoScroll(page);
        fs.writeFileSync(path.join(__dirname, '/data/' + searchFor + '.csv'), 'Data;Item;Link;Preço;Vendidos\n', 'utf8')

        const nomes = await page.$$eval('._18_85', el => el.map(price => price.innerHTML)); //ok
        const links = await page.$$eval('._3t7zg', el => el.map(link => link.href)); //ok
        let prices = await page.$$eval('._37W_B', el => el.map(price => price.innerHTML)); //ok
        prices = prices.map(price => price.replaceAll('<span style="font-size: 12px;">', '').replaceAll('</span>', '').replaceAll('<span style="font-size: 20px;">', '')); //ok
        const vendidos = await page.$$eval('._1kNf9', el => el.map(vendidos => vendidos.innerHTML)); //ok

        let data = '';
        for (let i in links) {
            var dados = {
                item: nomes[i] ? nomes[i] : searchFor,
                link: links[i],
                price: prices[i] ? prices[i] : 'Não encontrou valor',
                vendidos: vendidos[i] ? vendidos[i] : '0 vendidos',
            }
            data += `${moment().format('DD/MM/YYYY')};${dados.item};${dados.link};${dados.price};${dados.vendidos}\n`;
        }
        fs.appendFileSync(path.join(__dirname, '/data/' + searchFor + '.csv'), data, 'utf8')
        console.log('Scrapping concluído com sucesso!\nArquivo salvo em: ' + path.resolve(__dirname, '/data/' + searchFor + '.csv'));
        await browser.close();
        process.exit(0);
    });
})();

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}