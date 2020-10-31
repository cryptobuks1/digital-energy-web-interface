window.modActive = false;
$(document).ready(function() {
    let animate = true;
    let selector = 'last24h';
    let lastPrice = 9999;
    let lastCost = 9999;
    let infos = [];
    let infos_idx = 0;
    let info_timer = -1;
    let msgurl = "./msg";
    let upd_singleton = 0;
    if (typeof $.getUrlVar('reset') !== 'undefined') {
        window.localStorage.removeItem('msg');
    }

    if (typeof $.getUrlVar('s') !== 'undefined') {
        selector = $.getUrlVar('s');
        if (selector == 'last24h') {
            $('#selectorLabel').html("The last 24 hours");
        }
        if (selector == 'last7d') {
            $('#selectorLabel').html("The last 7 days");
        }
        if (selector == 'last30d') {
            $('#selectorLabel').html("The last 30 days");
        }
        if (selector == 'last90d') {
            $('#selectorLabel').html("The last 90 days");
        }
        if (selector == 'last180d') {
            $('#selectorLabel').html("The last 180 days");
        }
        if (selector == 'last365d') {
            $('#selectorLabel').html("The last 365 days");
        }
        if (selector == 'next24h') {
            $('#selectorLabel').html("Coming 24 hours");
        }
    } else {
        $('#selectorLabel').html("The last 24 hours");
    }
    const updateInfo = function() {}
    const render = function() {
        try {
            if ((typeof window.localStorage.getItem('msg') !== 'undefined') && (window.localStorage.getItem('msg') !== null)) {
                let data = JSON.parse(window.localStorage.getItem('msg'));
                if (lastPrice !== data.stats[selector].energyPrice_kwh) {
                    if (lastPrice !== 9999) {
                        if (lastPrice < data.stats[selector].energyPrice_kwh) {
                            $('#priceUp').show();
                            $('#priceDown').hide();
                            $('#energyPrice_kwh').addClass('digital_energy_orange');
                            $('#energyPrice_kwh').removeClass('digital_energy_green');
                        }
                        if (lastPrice > data.stats[selector].energyPrice_kwh) {
                            $('#priceUp').hide();
                            $('#priceDown').show();
                            $('#energyPrice_kwh').removeClass('digital_energy_orange');
                            $('#energyPrice_kwh').addClass('digital_energy_green');
                        }
                    }
                    lastPrice = data.stats[selector].energyPrice_kwh;
                }
                if (lastCost !== data.stats[selector].incomeSaldo) {
                    if (lastCost !== 9999) {
                        if (lastCost < data.stats[selector].incomeSaldo) {
                            $('#costDown').show();
                            $('#costUp').hide();
                            $('#incomeSaldo').addClass('digital_energy_green');
                            $('#incomeSaldo').removeClass('digital_energy_orange');
                        }
                        if (lastCost > data.stats[selector].incomeSaldo) {
                            $('#costDown').hide();
                            $('#costUp').show();
                            $('#incomeSaldo').addClass('digital_energy_orange');
                            $('#incomeSaldo').removeClass('digital_energy_green');
                        }
                    }
                    lastCost = data.stats[selector].incomeSaldo;
                }
                if (data.stats[selector].energyProd_wh == 0) { data.stats[selector].energyProd_wh = 0.0001; }
                if (selector == 'last24h') {
                    $('#modProd').attr('max', '100');
                    $('#modRequirement').attr('max', '100');
                }
                if (selector == 'last7d') {
                    $('#modProd').attr('max', '1000');
                    $('#modRequirement').attr('max', '1000');
                }
                if (selector == 'last30d') {
                    $('#modProd').attr('max', '5000');
                    $('#modRequirement').attr('max', '5000');
                }
                if (selector == 'last90d') {
                    $('#modProd').attr('max', '5000');
                    $('#modRequirement').attr('max', '5000');
                }
                if (selector == 'last180d') {
                    $('#modProd').attr('max', '25000');
                    $('#modRequirement').attr('max', '25000');
                }
                if (selector == 'last365d') {
                    $('#modProd').attr('max', '50000');
                    $('#modRequirement').attr('max', '50000');
                }
                $('#eigenRow').show();
                let ownconsumption = 1 - (data.stats[selector].energyOut_wh / data.stats[selector].energyProd_wh);
                if (window.modActive === false) {
                    $('#modOwnconsumption').val(ownconsumption * 100); // Only set if not set...
                    $('#modAmotisation').val(data.stats[selector].amortization);
                    $('#amotisation').html(data.stats[selector].amortization);
                    $('#Prod').html((data.stats[selector].energyProd_wh / 1000).toLocaleString('en-EN', { 'minimumFractionDigits': 3, 'maximumFractionDigits': 3 }));
                    $('#modProd').val(data.stats[selector].energyProd_wh / 1000);
                    $('#modRequirement').val(data.stats[selector].consumption_wh / 1000);
                } else {
                    data.stats[selector].amortization = $('#modAmotisation').val() * 1;
                    data.stats[selector].energyProd_wh = $('#modProd').val() * 1000;
                    data.stats[selector].consumption_wh = $('#modRequirement').val() * 1000;
                    ownconsumption = $('#modOwnconsumption').val() / 100;
                    let einspeisetarif = data.stats[selector].energyIncome / data.stats[selector].energyOut_wh;
                    data.stats[selector].energyOut_wh = data.stats[selector].energyProd_wh * (1 - ownconsumption);
                    data.stats[selector].energySelf_wh = data.stats[selector].energyProd_wh - data.stats[selector].energyOut_wh;
                    data.stats[selector].energyIncome = data.stats[selector].energyOut_wh * einspeisetarif;
                    data.stats[selector].energySavingsSelf = (data.meterinfo.energyPriceWh / 100) * data.stats[selector].energySelf_wh;
                    data.stats[selector].energySavingsSelf = Math.round((data.meterinfo.energyPriceWh - (einspeisetarif)) * data.stats[selector].energySelf_wh * 100) / 100;
                    data.stats[selector].energyRevenue = data.stats[selector].energyIncome + data.stats[selector].energySavingsSelf + data.stats[selector].digital_energyIncome;
                    data.stats[selector].energy_wh = data.stats[selector].consumption_wh - data.stats[selector].energySelf_wh;
                    data.stats[selector].energyCost = data.stats[selector].energy_wh * data.meterinfo.energyPriceWh;
                    data.stats[selector].energySpendings = data.stats[selector].energyCost + data.stats[selector].baseCosts + data.stats[selector].amortization;
                    data.stats[selector].incomeSaldo = data.stats[selector].energyRevenue - data.stats[selector].energySpendings;
                    data.stats[selector].energyPrice_kwh = (-1000) * (data.stats[selector].incomeSaldo / data.stats[selector].consumption_wh);
                    data.stats[selector].energyPriceWh = data.stats[selector].energyPrice_kwh / 1000;
                }
                // console.log("Energy Cost",data.stats[selector].energyCost);
                $('#ownconsumptionsQuote').html(Math.round(ownconsumption * 100));
                $('#amotisation').html(data.stats[selector].amortization);
                $('#Requirement').html((data.stats[selector].consumption_wh / 1000).toLocaleString('en-EN', { 'minimumFractionDigits': 3, 'maximumFractionDigits': 3 }));

                $('#energyPrice_kwh').html((data.stats[selector].energyPrice_kwh * 100).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));

                $('#last24h').html((data.stats.last24h.energyPrice_kwh * 100).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last7d !== 'undefined') $('#last7d').html((data.stats.last7d.energyPrice_kwh * 100).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));

                if (typeof data.stats.last30d !== 'undefined') $('#last30d').html((data.stats.last30d.energyPrice_kwh * 100).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));

                if (typeof data.stats.last90d !== 'undefined') $('#last90d').html((data.stats.last90d.energyPrice_kwh * 100).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));

                if (typeof data.stats.last180d !== 'undefined') $('#last180d').html((data.stats.last180d.energyPrice_kwh * 100).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));

                if (typeof data.stats.next24h !== 'undefined') $('#next24h').html((data.stats.next24h.energyPrice_kwh * 100).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));

                if (typeof data.stats.last365d !== 'undefined') $('#last365d').html((data.stats.last365d.energyPrice_kwh * 100).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                $('.updateTS').html(new Date(data.time).toLocaleString());

                $('#e24h').html((data.stats.last24h.energyRevenue).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last7d !== 'undefined') $('#e7d').html((data.stats.last7d.energyRevenue).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last30d !== 'undefined') $('#e30d').html((data.stats.last30d.energyRevenue).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last90d !== 'undefined') $('#e90d').html((data.stats.last90d.energyRevenue).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last180d !== 'undefined') $('#e180d').html((data.stats.last180d.energyRevenue).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));

                if (typeof data.stats.last365d !== 'undefined') $('#e365d').html((data.stats.last365d.energyRevenue).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));

                $('#a24h').html((data.stats.last24h.energySpendings).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last7d !== 'undefined') $('#a7d').html((data.stats.last7d.energySpendings).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last30d !== 'undefined') $('#a30d').html((data.stats.last30d.energySpendings).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last90d !== 'undefined') $('#a90d').html((data.stats.last90d.energySpendings).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last180d !== 'undefined') $('#a180d').html((data.stats.last180d.energySpendings).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last365d !== 'undefined') $('#a365d').html((data.stats.last365d.energySpendings).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));

                $('#incomeSaldo').html((data.stats[selector].incomeSaldo * (-1)).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                $('#s24h').html((data.stats.last24h.incomeSaldo * (-1)).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                if (typeof data.stats.last7d !== 'undefined') $('#s7d').html((data.stats.last7d.incomeSaldo * (-1)).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                else $('.row7d').hide();
                if (typeof data.stats.last30d !== 'undefined') $('#s30d').html((data.stats.last30d.incomeSaldo * (-1)).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                else $('.row30d').hide();
                if (typeof data.stats.last90d !== 'undefined') $('#s90d').html((data.stats.last90d.incomeSaldo * (-1)).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                else $('.row90d').hide();
                if (typeof data.stats.last180d !== 'undefined') $('#s180d').html((data.stats.last180d.incomeSaldo * (-1)).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                else $('.row180d').hide();
                if (typeof data.stats.last365d !== 'undefined') $('#s365d').html((data.stats.last365d.incomeSaldo * (-1)).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }));
                else $('.row365d').hide();

                if (typeof data.stats.next24h !== 'undefined') {} else $('.rownext24h').hide();

                document.title = "" + (data.stats[selector].energyPrice_kwh * 100).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }) + "/kWh " + (data.stats[selector].incomeSaldo * (-1)).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }) + "/Tag";


                if (typeof data.stats[selector].saldo_wh !== 'undefined') {
                    let sum_e = 0;
                    let cnt_e = 0;
                    let sum_b = 0;
                    let cnt_b = 0;

                    for (let i = 0; i < data.stats[selector].saldo_wh.saldo.length; i++) {
                        if (data.stats[selector].saldo_wh.saldo[i] > 0) {
                            sum_e += data.stats[selector].saldo_wh.saldo[i];
                            cnt_e++;
                        } else {
                            sum_b += data.stats[selector].saldo_wh.saldo[i];
                            cnt_b++;
                        }
                    }
                    let avg_e = 0;
                    let avg_b = 0;
                    if (cnt_e > 0) {
                        avg_e = sum_e / cnt_e;
                    }
                    if (cnt_b > 0) {
                        avg_b = sum_b / cnt_b;
                    }
                    let trail_html = '<table width="90%" style="width:90%"><tr style="height:5px;">';
                    let day = new Date(data.stats[selector].saldo_wh.start).getDay();
                    for (let i = 0; i < data.stats[selector].saldo_wh.saldo.length; i++) {
                        let tsi = (((data.stats[selector].saldo_wh.end - data.stats[selector].saldo_wh.start) / data.stats[selector].saldo_wh.saldo.length) * i) + data.stats[selector].saldo_wh.start;
                        let tst = new Date(tsi).toLocaleString();
                        if ((new Date(tsi).getDay() !== day) && ((selector == 'last7d') || (selector == 'last30d') || (selector == 'last90d') || (selector == 'last180d'))) {
                            day = new Date(tsi).getDay();
                            trail_html += '</tr><tr style="height:5px;">';
                        }

                        if (data.stats[selector].saldo_wh.saldo[i] > 0) {
                            if (data.stats[selector].saldo_wh.saldo[i] > avg_e) {
                                trail_html += '<td style="background-color:#e6b800" title="' + tst + ' Reference:' + Math.abs(data.stats[selector].saldo_wh.saldo[i]) + ' Wh"></td>';
                            } else {
                                trail_html += '<td style="background-color:#FFF6E4" title="' + tst + ' Reference:' + Math.abs(data.stats[selector].saldo_wh.saldo[i]) + ' Wh"></td>';
                            }
                        } else {
                            if (data.stats[selector].saldo_wh.saldo[i] < avg_b) {
                                trail_html += '<td style="background-color: #b38f00" title="' + tst + ' Feed:' + Math.abs(data.stats[selector].saldo_wh.saldo[i]) + ' Wh"></td>';
                            } else {
                                trail_html += '<td style="background-color:#ffcc00" title="' + tst + ' Feed:' + Math.abs(data.stats[selector].saldo_wh.saldo[i]) + ' Wh"></td>';
                            }
                        }

                    }
                    trail_html += '</tr></table>';
                    $('#trail').html(trail_html);
                    if (typeof data.latest.power_w !== 'undefined') {
                        $('#peerStatus').show();
                        if (data.latest.power_w > 0) {
                            if (data.latest.power_w > avg_e) {
                                $('#peerStatus').css('color', '#e6b800');
                            } else {
                                $('#peerStatus').css('color', ' #fff5cc');
                            }
                        } else {
                            if (data.latest.power_w < avg_b) {
                                $('#peerStatus').css('color', ' #b38f00');
                            } else {
                                $('#peerStatus').css('color', '#ffcc00');
                            }
                        }
                        $('#peerStatus').attr('title', data.latest.power_w + "W");
                    }
                }
                let ctx = $('#revenueChart');

                let edonut_data = [];
                let elabels = [];
                let ebar_datasets = [];
                let ebar_labels = [];

                ebar_labels.push('24 Hours');
                let total = (data.stats['last24h'].energySavingsSelf + data.stats['last24h'].energyIncome + data.stats['last24h'].digital_energyIncome) / 100;
                ebar_datasets.push({
                    label: 'Own electricity',
                    backgroundColor: ' #b38f00',
                    data: [data.stats['last24h'].energySavingsSelf / total]
                });
                ebar_datasets.push({
                    label: 'Feed',
                    backgroundColor: '#318b4e',
                    data: [data.stats['last24h'].energyIncome / total]
                });
                ebar_datasets.push({
                    label: 'digital_energy',
                    backgroundColor: '#ffcc00',
                    data: [data.stats['last24h'].digital_energyIncome / total]
                });
                if (typeof data.stats['last7d'] !== 'undefined') {
                    total = (data.stats['last7d'].energySavingsSelf + data.stats['last7d'].energyIncome + data.stats['last7d'].digital_energyIncome) / 100;
                    ebar_labels.push('7 Days');
                    ebar_datasets[0].data.push(data.stats['last7d'].energySavingsSelf / total);
                    ebar_datasets[1].data.push(data.stats['last7d'].energyIncome / total);
                    ebar_datasets[2].data.push(data.stats['last7d'].digital_energyIncome / total);
                }
                if (typeof data.stats['last30d'] !== 'undefined') {
                    ebar_labels.push('30 Days');
                    total = (data.stats['last30d'].energySavingsSelf + data.stats['last30d'].energyIncome + data.stats['last30d'].digital_energyIncome) / 100;
                    ebar_datasets[0].data.push(data.stats['last30d'].energySavingsSelf / total);
                    ebar_datasets[1].data.push(data.stats['last30d'].energyIncome / total);
                    ebar_datasets[2].data.push(data.stats['last30d'].digital_energyIncome / total);
                }
                if (typeof data.stats['last90d'] !== 'undefined') {
                    ebar_labels.push('90 Days');
                    total = (data.stats['last90d'].energySavingsSelf + data.stats['last90d'].energyIncome + data.stats['last90d'].digital_energyIncome) / 100;
                    ebar_datasets[0].data.push(data.stats['last90d'].energySavingsSelf / total);
                    ebar_datasets[1].data.push(data.stats['last90d'].energyIncome / total);
                    ebar_datasets[2].data.push(data.stats['last90d'].digital_energyIncome / total);
                }
                if (typeof data.stats['last180d'] !== 'undefined') {
                    ebar_labels.push('180 Days');
                    total = (data.stats['last180d'].energySavingsSelf + data.stats['last180d'].energyIncome + data.stats['last180d'].digital_energyIncome) / 100;
                    ebar_datasets[0].data.push(data.stats['last180d'].energySavingsSelf / total);
                    ebar_datasets[1].data.push(data.stats['last180d'].energyIncome / total);
                    ebar_datasets[2].data.push(data.stats['last180d'].digital_energyIncome / total);
                }
                if (typeof data.stats['last365d'] !== 'undefined') {
                    ebar_labels.push('365 Days');
                    total = (data.stats['last365d'].energySavingsSelf + data.stats['last365d'].energyIncome + data.stats['last365d'].digital_energyIncome) / 100;
                    ebar_datasets[0].data.push(data.stats['last365d'].energySavingsSelf / total);
                    ebar_datasets[1].data.push(data.stats['last365d'].energyIncome / total);
                    ebar_datasets[2].data.push(data.stats['last365d'].digital_energyIncome / total);
                }

                edonut_data.push(data.stats[selector].energySavingsSelf);
                elabels.push("Own electricity");

                edonut_data.push(data.stats[selector].energyIncome);
                elabels.push("Feed");

                edonut_data.push(data.stats[selector].digital_energyIncome);
                elabels.push("digital_energy Generation");

                if ($('#revenueChart').length !== 0) {
                    let myChartE = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            datasets: [{
                                label: 'revenue Distribution',
                                data: edonut_data,
                                backgroundColor: [
                                    '#b38f00',
                                    '#318b4e',
                                    '#ffcc00'
                                ]
                            }],
                            labels: elabels
                        },
                        options: {
                            responsive: true,
                            legend: {
                                position: 'right',
                            },
                            plugins: {
                                datalabels: {
                                    display: true,
                                    color: '#000000',
                                    formatter: function(value, context) {
                                        return ((value / data.stats[selector].energyRevenue) * 100).toFixed(1).replace('.', ',') + "%";
                                    }
                                }
                            },
                            title: {
                                display: false,
                                text: ''
                            },
                            animation: {
                                animateScale: animate,
                                animateRotate: animate
                            },
                            tooltips: {
                                enabled: true,
                                mode: 'single',
                                callbacks: {
                                    label: function(tooltipItems, data) {
                                        return elabels[tooltipItems.index] + ': ' + data.datasets[0].data[tooltipItems.index] + '€';
                                    }
                                }
                            },
                            elements: {
                                center: {
                                    text: (data.stats[selector].energyRevenue).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }),
                                    color: ' #b38f00', // Default is #000000
                                    fontStyle: 'Arial', // Default is Arial
                                    sidePadding: 20, // Default is 20 (as a percenDays)
                                    minFontSize: 20, // Default is 20 (in px), set to false and text will not wrap.
                                    lineHeight: 25 // Default is 25 (in px), used for when text wraps
                                }
                            }
                        }
                    });
                    ctx.click(function() {
                        $('#modalrevenue').modal("show");
                    });
                    let ctxEB = $('#revenueChartB');
                    let myChartEB = new Chart(ctxEB, {
                        type: 'bar',
                        data: {
                            datasets: ebar_datasets,
                            labels: ebar_labels
                        },
                        options: {
                            responsive: true,
                            tooltips: {
                                enabled: true,
                                mode: 'single',
                                callbacks: {
                                    label: function(tooltipItems, data) {
                                        return data.datasets[tooltipItems.datasetIndex].label + ': ' + Math.round(tooltipItems.value) + '%';
                                    }
                                }
                            },
                            plugins: {
                                datalabels: {
                                    display: true,
                                    color: '#000000',
                                    formatter: function(value, context) {
                                        return Math.round(value) + "%";
                                    }
                                }
                            },
                            legend: {
                                position: 'right',
                            },
                            title: {
                                display: false,
                                text: ''
                            },
                            animation: {
                                animateScale: animate,
                                animateRotate: animate
                            },
                            scales: {
                                xAxes: [{
                                    stacked: true,
                                }],
                                yAxes: [{
                                    stacked: true,
                                    ticks: {
                                        min: 0,
                                        max: 100
                                    }
                                }]
                            }
                        }
                    });

                    let ctxa = $('#expenditureChart');

                    let donut_data = [];
                    let labels = [];

                    donut_data.push(data.stats[selector].energyCost);
                    labels.push("Power Reference");

                    donut_data.push(data.stats[selector].amortization);
                    labels.push("Depreciation");

                    donut_data.push(data.stats[selector].baseCosts);
                    labels.push("Basic charge");

                    let abar_datasets = [];
                    let abar_labels = [];

                    abar_labels.push('24 Hours');
                    let total = (data.stats['last24h'].energyCost + data.stats['last24h'].amortization + data.stats['last24h'].baseCosts) / 100;
                    abar_datasets.push({
                        label: 'Power Reference',
                        backgroundColor: '#e6b800',
                        data: [data.stats['last24h'].energyCost / total]
                    });
                    abar_datasets.push({
                        label: 'Depreciation',
                        backgroundColor: '#FF8922',
                        data: [data.stats['last24h'].amortization / total]
                    });
                    abar_datasets.push({
                        label: 'Basic charge',
                        backgroundColor: '#FFF6E4',
                        data: [data.stats['last24h'].baseCosts / total]
                    });
                    if (typeof data.stats['last7d'] !== 'undefined') {
                        total = (data.stats['last7d'].energyCost + data.stats['last7d'].amortization + data.stats['last7d'].baseCosts) / 100;
                        abar_labels.push('7 Days');
                        abar_datasets[0].data.push(data.stats['last7d'].energyCost / total);
                        abar_datasets[1].data.push(data.stats['last7d'].amortization / total);
                        abar_datasets[2].data.push(data.stats['last7d'].baseCosts / total);
                    }
                    if (typeof data.stats['last30d'] !== 'undefined') {
                        abar_labels.push('30 Days');
                        total = (data.stats['last30d'].energyCost + data.stats['last30d'].amortization + data.stats['last30d'].baseCosts) / 100;
                        abar_datasets[0].data.push(data.stats['last30d'].energyCost / total);
                        abar_datasets[1].data.push(data.stats['last30d'].amortization / total);
                        abar_datasets[2].data.push(data.stats['last30d'].baseCosts / total);
                    }
                    if (typeof data.stats['last90d'] !== 'undefined') {
                        abar_labels.push('90 Days');
                        total = (data.stats['last90d'].energyCost + data.stats['last90d'].amortization + data.stats['last90d'].baseCosts) / 100;
                        abar_datasets[0].data.push(data.stats['last90d'].energyCost / total);
                        abar_datasets[1].data.push(data.stats['last90d'].amortization / total);
                        abar_datasets[2].data.push(data.stats['last90d'].baseCosts / total);
                    }
                    if (typeof data.stats['last180d'] !== 'undefined') {
                        abar_labels.push('180 Days');
                        total = (data.stats['last180d'].energyCost + data.stats['last180d'].amortization + data.stats['last180d'].baseCosts) / 100;
                        abar_datasets[0].data.push(data.stats['last180d'].energyCost / total);
                        abar_datasets[1].data.push(data.stats['last180d'].amortization / total);
                        abar_datasets[2].data.push(data.stats['last180d'].baseCosts / total);
                    }
                    if (typeof data.stats['last365d'] !== 'undefined') {
                        abar_labels.push('365 Days');
                        total = (data.stats['last365d'].energyCost + data.stats['last365d'].amortization + data.stats['last365d'].baseCosts) / 100;
                        abar_datasets[0].data.push(data.stats['last365d'].energyCost / total);
                        abar_datasets[1].data.push(data.stats['last365d'].amortization / total);
                        abar_datasets[2].data.push(data.stats['last365d'].baseCosts / total);
                    }
                    ctxa.click(function() {
                        $('#modalexpenditure').modal("show");
                    });
                    let myChartA = new Chart(ctxa, {
                        type: 'doughnut',
                        data: {
                            datasets: [{
                                label: 'expenditure Distribution',
                                data: donut_data,
                                backgroundColor: [
                                    '#e6b800',
                                    '#FF8922',
                                    '#FFF6E4'
                                ]
                            }],
                            labels: labels
                        },
                        options: {
                            responsive: true,
                            legend: {
                                position: 'left',
                            },
                            plugins: {
                                datalabels: {
                                    display: true,
                                    color: '#000000',
                                    formatter: function(value, context) {
                                        return ((value / data.stats[selector].energySpendings) * 100).toFixed(1).replace('.', ',') + "%";
                                    }
                                }
                            },
                            title: {
                                display: false,
                                text: ''
                            },
                            animation: {
                                animateScale: animate,
                                animateRotate: animate
                            },
                            tooltips: {
                                enabled: true,
                                mode: 'single',
                                callbacks: {
                                    label: function(tooltipItems, data) {
                                        return labels[tooltipItems.index] + ': ' + data.datasets[0].data[tooltipItems.index] + '€';
                                    }
                                }
                            },
                            elements: {
                                center: {
                                    text: (data.stats[selector].energySpendings).toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }),
                                    color: '#e6b800', // Default is #000000
                                    fontStyle: 'Arial', // Default is Arial
                                    sidePadding: 20, // Default is 20 (as a percenDays)
                                    minFontSize: 20, // Default is 20 (in px), set to false and text will not wrap.                          lineHeight: 25 // Default is 25 (in px), used for when text wraps
                                }
                            }
                        }
                    });

                    let ctxAB = $('#expenditureChartB');
                    let myChartAB = new Chart(ctxAB, {
                        type: 'bar',
                        data: {
                            datasets: abar_datasets,
                            labels: abar_labels
                        },
                        options: {
                            responsive: true,
                            tooltips: {
                                enabled: true,
                                mode: 'single',
                                callbacks: {
                                    label: function(tooltipItems, data) {
                                        return data.datasets[tooltipItems.datasetIndex].label + ': ' + Math.round(tooltipItems.value) + '%';
                                    }
                                }
                            },
                            plugins: {
                                datalabels: {
                                    display: true,
                                    color: '#000000',
                                    formatter: function(value, context) {
                                        return Math.round(value) + "%";
                                    }
                                }
                            },
                            legend: {
                                position: 'right',
                            },
                            title: {
                                display: false,
                                text: ''
                            },
                            animation: {
                                animateScale: animate,
                                animateRotate: animate
                            },
                            scales: {
                                xAxes: [{
                                    stacked: true,
                                }],
                                yAxes: [{
                                    stacked: true,
                                    ticks: {
                                        min: 0,
                                        max: 100
                                    }
                                }]
                            }
                        }
                    });
                }
                if (animate) {
                    setTimeout(function() {
                        $('#info').addClass('show');
                    }, 2000);
                }
                animate = false;
                let costs = (data.stats[selector].consumption_wh * data.meterinfo.energyPriceWh) + data.stats[selector].baseCosts;
                let savings = Math.round((1 - (((-1) * data.stats[selector].incomeSaldo) / costs)) * (10000)) / 100;

                if (info_timer < new Date().getTime() - 60000) {
                    if ((window.swiper.slides) && (window.swiper.slides.length > 0)) {
                        window.swiper.removeAllSlides();
                    }
                    if (window.swiper.slides) {
                        window.swiper.appendSlide('<div class="blog-slider__item swiper-slide"><div class="blog-slider__content"><div class="blog-slider__title"><i class="fa fa-info-circle" style="  margin-right: 10px;"></i>expenditure</div><div class="blog-slider__text" id="info0"><strong>' + Math.round((data.stats[selector].energyCost / data.stats[selector].energySpendings) * 100) + '%</strong> der Kosten von ' + data.stats[selector].energySpendings.toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }) + '€ für die Stromversorgung sind variabel, d.h. können durch den Verbrauch unmittelbar beeinflusst werden.</div></div></div>');

                        window.swiper.appendSlide('<div class="blog-slider__item swiper-slide"><div class="blog-slider__content"><div class="blog-slider__title"><i class="fa fa-wrench" style="  margin-right: 10px;"></i>Ergebnis</div><div class="blog-slider__text" id="info1">Steigere den NetzReference zu Zeiten mit hohen Werten des GrünstromIndex, um die Erträge aus digital_energy Generation von dProdeit <strong>' + data.stats[selector].digital_energyIncome.toLocaleString('en-EN', { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }) + '€</strong> zu eröhen.</div></div></div>');

                        window.swiper.appendSlide('<div class="blog-slider__item swiper-slide"><div class="blog-slider__content"><div class="blog-slider__title"><i class="fa fa-tachometer" style="  margin-right: 10px;"></i>Ergebnis</div><div class="blog-slider__text" id="info1"><strong>' + savings.toLocaleString('en-EN', { 'minimumFractionDigits': 0, 'maximumFractionDigits': 2 }) + '%</strong> im Vergleich zu einem Anschluss ohne eigene Generation, Speicher oder digital_energy GrünstromBonus.</div></div></div>');
                    }
                    info_timer = new Date().getTime();
                }
            }
            $('#modownconsumption').change(function() {
                if (!window.modActive) {
                    $('.planerRows').hide();
                    $('#eigenRow').show();
                }
                window.modActive = true;

                render();
            });
            $('#modownconsumption').on('input change', function() {
                $('#ownconsumptionsQuote').html($('#modownconsumption').val());
            });
            $('#modAmotisation').change(function() {
                if (!window.modActive) {
                    $('.planerRows').hide();
                    $('#amotRow').show();
                }
                window.modActive = true;
                render();
            });
            $('#modAmotisation').on('input change', function() {
                $('#amotisation').html($('#modAmotisation').val());
            });
            $('#modProd').change(function() {
                if (!window.modActive) {
                    $('.planerRows').hide();
                    $('#ProdRow').show();
                }
                window.modActive = true;
                render();
            });
            $('#modProd').on('input change', function() {
                $('#Prod').html(($('#modProd').val() / 1000).toLocaleString('en-EN', { 'minimumFractionDigits': 3, 'maximumFractionDigits': 3 }));
            });
            $('#modRequirement').change(function() {
                if (!window.modActive) {
                    $('.planerRows').hide();
                    $('#bedRow').show();
                }
                window.modActive = true;
                render();
            });
            $('#modRequirement').on('input change', function() {
                $('#Requirement').html(($('#modRequirement').val() / 1000).toLocaleString('en-EN', { 'minimumFractionDigits': 3, 'maximumFractionDigits': 3 }));
            });
        } catch (e) {
            console.log(e);
            window.localStorage.removeItem('msg');
            console.log("Removed stalled cached msg");
            setTimeout(function() {
                update();
            }, 1000);
        }
    }
    const update = function() {

        if ((typeof window.localStorage.getItem('cid') !== 'undefined') && (window.localStorage.getItem('cid') !== null)) {
            msgurl = './p2p?method=msg&peer=' + window.localStorage.getItem('cid');
        } else {
            msgurl = './msg';
        }
        if ((upd_singleton > 20) || (upd_singleton == 0)) {

            $.getJSON(msgurl, function(data) {
                window.localStorage.setItem('msg', JSON.stringify(data));
                upd_singleton = 0;
                render();
            }).fail(function() {
                console.log("Switched to WAN Source");
                $.getJSON("https://casa-digital_energy-demo.herokuapp.com/" + msgurl, function(data) {
                    window.localStorage.setItem('msg', JSON.stringify(data));
                    upd_singleton = 0;
                    render();
                })
            });
        }
        upd_singleton++;
    }
    render();
    setInterval(update, 10000);
    update();

});