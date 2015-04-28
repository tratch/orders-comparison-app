$(document).ready(function() {

  var chart = null;   // Reference to the chart object so that we can update it

  // Fired when someone clicks the "Compare" button
  var onSubmitClick = function() {

    // Retreive the form values
    var monthStr = $('[name=month]').val(),
        firstYearStr = $('[name=first-year]').val(),
        secondYearStr = $('[name=second-year]').val(),
        category = $('[name=category]:checked').val();

    // Get the arguments for the first AJAX call to our API.
    // The result will be something like: "start=2015-01-01&end=2015-02-01"
    var firstYearParams = $.param({
      start: getStart(firstYearStr, monthStr),
      end: getEnd(firstYearStr, monthStr)
    });

    // Get the arguments for the second AJAX call to our API.
    // The result will be something like: "start=2014-01-01&end=2014-02-01"
    var secondYearParams = $.param({
      start: getStart(secondYearStr, monthStr),
      end: getEnd(secondYearStr, monthStr)
    });

    // Make the AJAX calls to our Apitite API. Store the handles to these AJAX calls (known as *deferreds*) becasue we will need
    // them to extract the results.
    var firstDeferred = $.ajax('https://www.apitite.net/api/webinar-template/get-orders-by-day/json?' + firstYearParams);
    var secondDeferred = $.ajax('https://www.apitite.net/api/webinar-template/get-orders-by-day/json?' + secondYearParams);

    // $.when waits for *both* AJAX calls to complete before executing the callback function we provide
    $.when(firstDeferred, secondDeferred).done(function(firstYearResults, secondYearResults) {
      // Each of the arguments to this callback is an array of the form: [data, textStatus, jqXHR].
      // We are only interested in the data portion of each argument.
      var firstYearData = firstYearResults[0],
          secondYearData = secondYearResults[0];

      if (chart) {
        updateChart(category, firstYearStr, firstYearData, secondYearStr, secondYearData);
      } else {
        drawChart(category, firstYearStr, firstYearData, secondYearStr, secondYearData);
      }
    });

    return false; // If we don't return false, the form is actually submitted to the server (not what we want) and the page refreshes
  };

  // See http://www.chartjs.org/docs/ for more information about how this function works.
  var drawChart = function(category, firstYearStr, firstYearData, secondYearStr, secondYearData) {
    // Get the context of the canvas element we want to select
    var ctx = $('#chart')[0].getContext('2d');

    // firstYearData (and secondYearData) have the form:
    // {
    //    _id: dayOfMonth,
    //    orders: totalOrdersForDay,
    //    revenue: totalRevenueForDay
    //  }

    // We are only interested in the "orders" or "revenue" fields, depending on the value of the category variable.
    // _.pluck, used below, is a convenience method that returns an array of property values.
    // for instance, _.pluck(firstYearData, category) where category == 'orders' would return an array of only the orders values from
    // firstYearData.
    
    // The data that the chart will display
    var data = {
      labels: _.range(1, firstYearData.length + 1), // 1, 2, 3, ..., 31 (or 30, or 28, or 29, depending on the month and year)
      datasets: [
        {
          label: firstYearStr,
          fillColor: "rgba(220,220,220,0.2)",
          strokeColor: "rgba(220,220,220,1)",
          pointColor: "rgba(220,220,220,1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(220,220,220,1)",
          data: _.pluck(firstYearData, category)
        },
        {
          label: secondYearStr,
          fillColor: "rgba(151,187,205,0.2)",
          strokeColor: "rgba(151,187,205,1)",
          pointColor: "rgba(151,187,205,1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(151,187,205,1)",
          data: _.pluck(secondYearData, category)
        }
      ]
    };

    // Create the actual chart, and save a reference to it.
    chart = new Chart(ctx).Line(data);
  };

  var updateChart = function(category, firstYearStr, firstYearData, secondYearStr, secondYearData) {
    var firstYearValues = _.pluck(firstYearData, category);
    var secondYearValues = _.pluck(secondYearData, category);

    // Change the value of each point in the chart's dataset to reflect the new data
    for (var i = 0; i < firstYearValues.length; i++) {
      chart.datasets[0].points[i].value = firstYearValues[i];
      chart.datasets[1].points[i].value = secondYearValues[i];
    }

    chart.update();
  };

  // Utility method for getting a starting date string in the format: "YYYY-MM-DD" given the starting year and month.
  // e.g. getStart('2015', '03') --> '2015-03-01'
  var getStart = function(yearStr, monthStr) {
    // return YYYY-MM-DD
    return yearStr + '-' + monthStr + '-01';
  };

  // Utility method for getting an ending date string, representing the first of the following month,
  // in the format: "YYYY-MM-DD", given the starting year and month.
  // e.g. getEnd('2015', '03') --> '2015-04-01'
  // e.g. getEnd('2014', '12') --> '2015-01-01'
  var getEnd = function(yearStr, monthStr) {
    var month = parseInt(monthStr, 10),
        year = parseInt(yearStr, 10);
    if (month < 12)
      return yearStr + '-' + ('0' + (month+1)).slice(-2) + '-01';
    else
      return (year+1) + '-01-01';
  };

  $('button[type=submit]').on('click', onSubmitClick);

});