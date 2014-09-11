var version     = require( '../package.json' ).version;
var request     = require( 'request' );
var _           = require( 'lodash' );
var url         = require( 'url' );
var xml2js      = require( 'xml2js' );
var parseString = require( 'xml2js' ).parseString;
var FuelAuth    = require( 'fuel-auth' );


var FuelSoap = function (options) {
	'use strict';

    var authOptions = options && options.auth || {};

    // use fuel auth instance if applicable
    if( authOptions instanceof  FuelAuth ) {
        this.AuthClient = authOptions;
    } else {
        try {
            this.AuthClient = new FuelAuth( authOptions );
        } catch ( err ) {
            throw err;
        }
    }

	// adding version to object
	this.version = version;

	// setting up default headers
	this.defaultHeaders = {
		'User-Agent': 'node-fuel/' + this.version,
		'Content-Type': 'text/xml'
	};

	// configuring soap options
	this.requestOptions = {};
	this.requestOptions.uri = options.soapEndpoint || 'https://webservice.exacttarget.com/Service.asmx';
	this.requestOptions.method = 'POST';
};


FuelSoap.prototype.create = function (type, props, options, callback) {

    if (arguments.length < 4) {
        //if options are not included
        if (Object.prototype.toString.call(arguments[2]) == "[object Function]") {
            callback = options;
            options = null;
        }
    }

    var body = {
        'CreateRequest': {
            '$': {
                'xmlns': 'http://exacttarget.com/wsdl/partnerAPI'
            },
            'Options': options
        }
    };

    body.CreateRequest.Objects = props;
    body.CreateRequest.Objects['$'] = {
        'xsi:type': type
    };

    this.soapRequest({
        action: 'Create',
        req: body,
        key: 'CreateResponse'
    }, callback);
};

FuelSoap.prototype.retrieve = function (type, props, filter, callback) {
	var defaultProps = ['Client', 'ID', 'ObjectID'];

	if (arguments.length < 4) {
		//if props and filter are not included
		if (Object.prototype.toString.call(arguments[1]) == "[object Function]") {
			callback = props;
			filter = null;
			props = defaultProps;
		}

		//if props or filter is included
		if (Object.prototype.toString.call(arguments[2]) == "[object Function]") {

			callback = filter;
			//check if props or filter
			if (Object.prototype.toString.call(arguments[1]) == "[object Object]") {
				filter = props;
				props = defaultProps;
			} else {
				filter = null;
			}
		}
	}

	//TO-DO How to handle casing with properties?

	var body = {
		'RetrieveRequestMsg': {
			'$': {
				'xmlns': 'http://exacttarget.com/wsdl/partnerAPI'
			},
			'RetrieveRequest': {
				'ObjectType': type,
				'Properties': props
			}
		}
	};

	// filter can be simple or complex and has three properties leftOperand, rightOperand, and operator
	if (filter) {
		body.RetrieveRequestMsg.RetrieveRequest.Filter = this._parseFilter(filter);
	}

    this.soapRequest({
        action: 'Retrieve',
        req: body,
        key: 'RetrieveResponseMsg'
    }, callback);
};

// TO-DO Handle other simple filter value types like DateValue
FuelSoap.prototype._parseFilter = function(filter) {
    var fType = (_.isObject(filter.leftOperand) && _.isObject(filter.rightOperand)) ? "Complex" : "Simple";
    var obj = {
        '$': {
            'xsi:type': fType + "FilterPart"
        }
    };

    if (fType === "Complex") {
        obj.LeftOperand = this._parseFilter(filter.leftOperand);
        obj.LogicalOperator = filter.operator;
        obj.RightOperand = this._parseFilter(filter.rightOperand);
    } else {
        obj.Property = filter.leftOperand;
        obj.SimpleOperator = filter.operator;
        obj.Value = filter.rightOperand;
    }

    return obj;
};

FuelSoap.prototype.update = function (type, props, options, callback) {

    if (arguments.length < 4) {
        //if options are not included
        if (Object.prototype.toString.call(arguments[2]) == "[object Function]") {
            callback = options;
            options = null;
        }
    }

    var body = {
        'UpdateRequest': {
            '$': {
                'xmlns': 'http://exacttarget.com/wsdl/partnerAPI'
            },
            'Options': options
        }
    };

    body.UpdateRequest.Objects = props;
    body.UpdateRequest.Objects['$'] = {
        'xsi:type': type
    };

    this.soapRequest({
        action: 'Update',
        req: body,
        key: 'UpdateResponse'
    }, callback);
};

FuelSoap.prototype.delete = function (type, props, options, callback) {

    if (arguments.length < 4) {
        //if options are not included
        if (Object.prototype.toString.call(arguments[2]) == "[object Function]") {
            callback = options;
            options = null;
        }
    }

    var body = {
        'DeleteRequest': {
            '$': {
                'xmlns': 'http://exacttarget.com/wsdl/partnerAPI'
            },
            'Options': options
        }
    };

    body.DeleteRequest.Objects = props;
    body.DeleteRequest.Objects['$'] = {
        'xsi:type': type
    };

    this.soapRequest({
        action: 'Delete',
        req: body,
        key: 'DeleteResponse'
    }, callback);
};

FuelSoap.prototype.query = function () {

};

FuelSoap.prototype.describe = function (type, callback) {

	var body = {
		DefinitionRequestMsg: {
			'$': {
				'xmlns': 'http://exacttarget.com/wsdl/partnerAPI'
			},
			'DescribeRequests': {
				'ObjectDefinitionRequest': {
					'ObjectType': type
				}
			}
		}
	};

    this.soapRequest({
        action: 'Describe',
        req: body,
        key: 'DefinitionResponseMsg'
    }, callback);
};

FuelSoap.prototype.execute = function () {

};

FuelSoap.prototype.perform = function () {

};

FuelSoap.prototype.configure = function () {

};

FuelSoap.prototype.schedule = function () {

};

FuelSoap.prototype.versionInfo = function () {

};

FuelSoap.prototype.extract = function () {

};

FuelSoap.prototype.getSystemStatus = function () {

};

FuelSoap.prototype._buildEnvelope = function (request, token) {

	var envelope = {
		'$': {
			"xmlns": "http://schemas.xmlsoap.org/soap/envelope/",
			"xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
		},
		'Header': {
			'fueloauth': {
				'$': {
					"xmlns": "http://exacttarget.com"
				},
				"_": token
			}
		},
		"Body": request
	}


	var buildOptions = {
		rootName: "Envelope",
		headless: true
	}

	var builder = new xml2js.Builder(buildOptions);
	return builder.buildObject(envelope);
};


FuelSoap.prototype.soapRequest = function (options, callback) {
    'use strict';

    // we need a callback
    if( !_.isFunction( callback ) ) {
        throw new TypeError( 'callback argument is required.' );
    }

    // we need options
    if( !_.isPlainObject( options ) ) {
        throw new TypeError( 'options argument is required' );
    }

	var requestOptions = this.requestOptions;
	requestOptions.headers = this.defaultHeaders;
	requestOptions.headers.SOAPAction = options.action;

	this.AuthClient.getAccessToken( function( err, body ) {
        var localError;

        if( err ) {
            this._deliverResponse( 'error', err, callback, 'FuelAuth' );
            return;
        }

        // if there's no access token we have a problem
        if ( !body.accessToken ) {
            localError = new Error( 'No access token' );
            localError.res = body;
            this._deliverResponse( 'error', localError, callback, 'FuelAuth' );
            return;
        }

        var env = this._buildEnvelope(options.req, body.accessToken);
        console.log(env);
        requestOptions.body = env;

        request(requestOptions, function (err, res, body) {
            if (err) {
                this._deliverResponse( 'error', err, callback, 'Request Module inside soapRequest' );
            } else {
                this._parseResponse( options.key, body, callback );
            }
        }.bind( this ) );
    }.bind( this ) );
};

FuelSoap.prototype._parseResponse = function(key, body, callback) {
    var parseOptions = {
        trim: true,
        normalize: true,
        explicitArray: false,
        ignoreAttrs: true
    };

    parseString(body, parseOptions, function (err, res) {

        if( err ) {
            this._deliverResponse( 'error', err, callback, 'xml2js.parseString' );
            return;
        }

        var soapError;
        var soapBody = res['soap:Envelope']['soap:Body'];

        // Check for SOAP Fault
        if ( soapBody['soap:Fault']) {
            var fault = soapBody['soap:Fault'];
            soapError = new Error(fault.faultstring);
            soapError.faultCode = fault.faultcode;
            if ( fault.detail ) {
                soapError.detail = fault.detail;
            }
            this._deliverResponse( 'error', soapError, callback, 'SOAP Fault' );
            return;
        }

        var parsedRes = soapBody[key];

        if (key === 'DefinitionResponseMsg') {
            // Return empty object if no ObjectDefinition is returned.
            parsedRes.ObjectDefinition = parsedRes.ObjectDefinition || {};
            this._deliverResponse( 'response', parsedRes, callback );
            return;
        }

        // Results should always be an array
        parsedRes.Results = _.isArray(parsedRes.Results) ? parsedRes.Results : _.isObject(parsedRes.Results) ? [parsedRes.Results] : [];

        if (key === 'RetrieveResponseMsg') {
            if ( parsedRes.OverallStatus === 'OK' || parsedRes.OverallStatus === 'MoreDataAvailable') {
                this._deliverResponse( 'response', parsedRes, callback );
            } else {
                // This is an error
                console.log(parsedRes.OverallStatus.split(':')[1].trim());
                soapError = new Error(parsedRes.OverallStatus.split(':')[1].trim());
                soapError.requestId = parsedRes.RequestID;
                this._deliverResponse( 'error', soapError, callback, 'Retrieve Response' );
            }
            return;
        }

        if ( parsedRes.OverallStatus === 'Error' ||  parsedRes.OverallStatus === 'Has Errors') {
            soapError = new Error('Soap Error');
            soapError.requestId = parsedRes.RequestID;
            soapError.results = parsedRes.Results;
            this._deliverResponse( 'error', soapError, callback, key );
            return;
        }

        this._deliverResponse( 'response', parsedRes, callback );
    }.bind( this ) );
};

FuelSoap.prototype._deliverResponse = function( type, data, callback, errorFrom ) {
    'use strict';

    // if it's an error and we have where it occured, let's tack it on
    if( type === 'error' ) {

        if( !!errorFrom ) {
            data.errorPropagatedFrom = errorFrom;
        }

        callback( data, null );

    } else if ( type === 'response' ) {

        callback( null, data);

    }
}

module.exports = FuelSoap;