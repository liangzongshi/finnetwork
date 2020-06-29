$(document).ready(() => {
    const socket = io()
    socket.on('connect', () => {})

    var options = {
		chart: {
			height: 365,
			type: 'pie',
		},
		dataLabels: {
			dropShadow: {
				enabled: false,
				top: 1,
				left: 1,
				blur: 1,
				opacity: 0.45
			}
		},
		colors: [COLOR_PINK, COLOR_ORANGE, COLOR_BLUE, COLOR_TEAL, COLOR_INDIGO],
		labels: ['Bitcoin', 'Ethereum', 'Tether', 'Finfine', 'Binance'],
		series: [Number($('#usd-BTC').text()), Number($('#usd-ETH').text()), Number($('#usd-USDT').text()), Number($('#usd-FFT').text()), Number($('#usd-BNB').text())],
		title: {
			text: 'Property structure'
		}
	};

	var chart = new ApexCharts( document.querySelector('#apex-pie-chart'), options)

    chart.render()
    
    $('button').click((e) => {
        const percent = JSON.parse($(e)[0].target.dataset.percent)
        if (percent !== undefined){
            const max = Number($(`#withdraw-max-${percent.symbol}`).text())
            $(`#withdraw-amount-${percent.symbol}`).val((max*percent.per/100).toFixed(3))
            const maxs = Number($(`#swap-max-${percent.symbol}`).text())
            $(`#swap-amount-${percent.symbol}`).val((maxs*percent.per/100).toFixed(3))
        }
    })

    $('a').click((e) => {
        var order
        if ($(e)[0].target.dataset.order !== undefined){
            order = JSON.parse($(e)[0].target.dataset.order)
        }
        console.log(order)
        if (order !== undefined){
            var order_data = {
                action: order.action,
                symbol: order.symbol,
                address: $(`#${order.action}-address-${order.symbol}`).val(),
                amount: Number($(`#${order.action}-amount-${order.symbol}`).val()),
                to: $(`#${order.action}-to-${order.symbol}`).val(),
                auth: $(`#auth-${order.symbol}`).val()
            }
            if (order.symbol == 'BNB'){
                order_data.memo = $('#wit_memo').val()
            }
            socket.emit('balance', order_data)
        }
    })

    socket.on('send-err-balance', data => {
        console.log(data)
        if (data.error == undefined){

            const balance = Number($(`#bal-${data.symbol}`).text())
            const avai = Number($(`#avai-${data.symbol}`).text())

            const balanceFFT = Number($(`#bal-FFT`).text())
            const avaiFFT = Number($(`#avai-FFT`).text())

            const priceUSD = 1
            const priceFFT = data.priceFFT

            // alert((balance - data.value) * priceUSD )
            if (data.type == 'switchout' || data.type == 'withdraw'){
                $(`#md-withdraw-${data.symbol}`).modal('hide')
                $(`#bal-${data.symbol}`).html((balance - data.value).toFixed(3))
                $(`#avai-${data.symbol}`).html((avai - data.value).toFixed(3))
                $(`#fft-${data.symbol}`).html( ( (balance - data.value) * priceFFT ).toFixed(3) )
                $(`#usd-${data.symbol}`).html(( (balance - data.value) * priceUSD ).toFixed(3))

                $(`#withdraw-max-${data.symbol}`).html((avai - data.value).toFixed(3))
                $(`#swap-max-${data.symbol}`).html((avai - data.value).toFixed(3))
            }

            if (data.type == 'swapin'){
                $(`#md-swap-${data.symbol}`).modal('hide')
                $(`#bal-${data.symbol}`).html((balance - data.value).toFixed(3))
                $(`#avai-${data.symbol}`).html((avai - data.value).toFixed(3))

                $(`#fft-${data.symbol}`).html( ( (balance - data.value) * priceFFT ).toFixed(3) )
                $(`#usd-${data.symbol}`).html(( (balance - data.value) * priceUSD ).toFixed(3))

                $(`#bal-FFT`).html(( balanceFFT + data.value * data.price ).toFixed(3))
                // $(`#avai-FFT`).html((avai + data.value * data.price).toFixed(3))

                $(`#fft-FFT`).html( ( (balanceFFT + data.value * data.price) * priceFFT ).toFixed(3) )
                $(`#usd-FFT`).html(( (balanceFFT + data.value * data.price) * priceUSD ).toFixed(3))

                $(`#withdraw-max-${data.symbol}`).text((avai - data.value).toFixed(3))
                $(`#swap-max-${data.symbol}`).text((avai - data.value).toFixed(3))
            }

            if (data.type == 'swapout'){
                $(`#md-swap-FFT`).modal('hide')
                $(`#bal-${data.symbol}`).html((balance + data.value).toFixed(3))
                $(`#avai-${data.symbol}`).html((avai + data.value).toFixed(3))

                $(`#fft-${data.symbol}`).html( ( (balance + data.value) * priceFFT ).toFixed(3) )
                $(`#usd-${data.symbol}`).html(( (balance + data.value) * priceUSD ).toFixed(3))

                $(`#bal-FFT`).html(( balanceFFT - data.value * data.price ).toFixed(3))
                $(`#avai-FFT`).html((avaiFFT - data.value * data.price).toFixed(3))

                $(`#fft-FFT`).html( ( (balanceFFT - data.value * data.price) * priceFFT ).toFixed(3) )
                $(`#usd-FFT`).html(( (balanceFFT - data.value * data.price) * priceUSD ).toFixed(3))

                $(`#withdraw-max-${data.symbol}`).text((avai + data.value).toFixed(3))
                $(`#swap-max-${data.symbol}`).text((avai + data.value).toFixed(3))

                $(`#withdraw-max-FFT`).text((avaiFFT - data.value * data.price).toFixed(3))
                $(`#swap-max-FFT`).text((avaiFFT - data.value * data.price).toFixed(3))
            } 

        } else {
            const des = (data.error == 'auth') ? 'The verification code is incorrect' : 'Balance is not enough'
            $(`#check-${data.error}-${data.symbol}`).html(des)
            if (data.error == 'amount'){
                $(`#checkswap-${data.error}-${data.symbol}`).html(des)
            }

            setTimeout(() => {
                $(`#check-${data.error}-${data.symbol}`).html('')
                if (data.error == 'amount'){
                    $(`#checkswap-${data.error}-${data.symbol}`).html('')
                }
            }, 2000)
        }
    })

    $("#expected_capital, #expected_symbol, #expected_period").change(() => {
        const amount = $('#expected_capital').val()
        const symbol = $('#expected_symbol option:selected').text()
        const period = $('#expected_period option:selected').text()
        console.log(amount, symbol, period)
        socket.emit('calculator', {
            amount: amount,
            symbol: symbol,
            period: period
        })
    })

    socket.on('complete_calculator', data => {
        $('#numberFTT').html('Receive: ' + data.numberFTT + ' FFT')
        $('#percentFund').html('Ratio: ' + data.percentFund + ' %')
        $('#sym').html(data.sym + ': ')
        $('#expectedSYM').html(data.expectedSYM)
        
        $('#expectedFFT').html('FFT: ' + data.expectedFFT)
        $('#expectedProfit').html('Collected: ' + data.expectedProfit)
        $('#percentProfit').html('Net Interest Rates: ' + data.percentProfit + ' %')
    })
})
