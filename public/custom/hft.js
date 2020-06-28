$(document).ready(() => {
    const socket = io()

    var xchart, ychart
    socket.on('appendOrder', data => {
        
        xchart.updateSeries([{
            data: data.series
        }])

        data.orders.forEach((order, st) => {
            $(`#${st+1}_timestamp`).html(order.timestamp)
            if(order.type == "BTC"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/btc.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "ETH"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/eth.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "XRP"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/xrp.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "LTC"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/ltc.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "BCH"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/bch.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "EOS"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/eos.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "DASH"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/dash.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "XLM"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/xlm.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "ETC"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/etc.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "ATOM"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/atom.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "XTZ"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/zrx.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "OMG"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/omg.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "LINK"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/link.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "ZRX"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/zrx.png" class="img-rounded width-30 height-30" />`)
            }else if(order.type == "ALGO"){
                $(`#${st+1}_type`).html(`<img src="../assets/coin/algo.png" class="img-rounded width-30 height-30" />`)
            }
            // $(`#${st+1}_type`).html(order.type)
            $(`#${st+1}_amount`).html(order.amount)
            $(`#${st+1}_buy`).html(order.buy.price)
            $(`#${st+1}_sell`).html(order.sell.price)
            $(`#${st+1}_profit`).html(order.profit)
        })

        $('#current_profit').html(data.profit)
        $('#total_profit').html(data.total_profit)
        $('#number').html(data.number)
    })

    socket.on('startChart', data => {
        console.log(data)
        var options = {
            series: [{
                data: data
            }],
            xaxis: {
                type: 'datetime',
                // range: XAXISRANGE,
            },
            chart: {
                id: 'realtime',
                height: 350,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 900
                    }
                },
                toolbar: {
                    show: true
                },
                zoom: {
                    enabled: true
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            title: {
                text: 'Profit per Order',
                align: 'center'
            },
            markers: {
                size: 0
            },
            yaxis: {
                max: 120,
                min: 0.05,
                axisBorder: {
                    show: true,
                    color: '#78909C'
                }
            },
            legend: {
                show: true
            },
        }  

        xchart = new ApexCharts(document.querySelector("#apex-line-chart"), options);
        xchart.render()
    })

    socket.on('daily_chart', data => {
        var options = {
            series: [{
                data: data.record_value
            }, {
                data: data.pay_value
            }],
            chart: {
                type: 'bar',
                height: 640
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    dataLabels: {
                        position: 'top',
                    },
                }
            },
            dataLabels: {
                enabled: true,
                offsetX: -6,
                style: {
                    fontSize: '9px',
                    colors: ['#fff']
                }
            },
            stroke: {
                show: true,
                width: 1,
                colors: ['#fff']
            },
            xaxis: {
                categories: data.record_label,
            },
            yaxis: {
                max: 150000,
                min: 10000,
                axisBorder: {
                    show: true,
                    color: '#78909C'
                }
            }
            
        }

        ychart = new ApexCharts(document.querySelector("#daily"), options)
        ychart.render()
    })
})