/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var UnsupportedFeatureWarning = require("../UnsupportedFeatureWarning");
var ConstDependency = require("./ConstDependency");
var BasicEvaluatedExpression = require("../BasicEvaluatedExpression");

function SystemPlugin(options) {
	this.options = options;
}
module.exports = SystemPlugin;

SystemPlugin.prototype.apply = function(compiler) {
	compiler.plugin("compilation", function(compilation, params) {
		params.normalModuleFactory.plugin("parser", function(parser, parserOptions) {

			if(typeof parserOptions.system !== "undefined" && !parserOptions.system)
				return;

			function setTypeof(expr, value) {
				parser.plugin("evaluate typeof " + expr, function(expr) {
					return new BasicEvaluatedExpression().setString(value).setRange(expr.range);
				});
				parser.plugin("typeof " + expr, function(expr) {
					var dep = new ConstDependency(JSON.stringify(value), expr.range);
					dep.loc = expr.loc;
					this.state.current.addDependency(dep);
					return true;
				});
			}

			function setNotSupported(name) {
				parser.plugin("evaluate typeof " + name, function(expr) {
					return new BasicEvaluatedExpression().setString("undefined").setRange(expr.range);
				});
				parser.plugin("expression " + name, function(expr) {
					var dep = new ConstDependency("(void 0)", expr.range);
					dep.loc = expr.loc;
					this.state.current.addDependency(dep);
					if(!this.state.module) return;
					this.state.module.warnings.push(new UnsupportedFeatureWarning(this.state.module, name + " is not supported by webpack."));
					return true;
				});
			}

			setTypeof("System", "object");
			setTypeof("System.import", "function");
			setNotSupported("System.set");
			setNotSupported("System.get");
			setNotSupported("System.register");
			parser.plugin("expression System", function(expr) {
				var dep = new ConstDependency("{}", expr.range);
				dep.loc = expr.loc;
				this.state.current.addDependency(dep);
				return true;
			});
		});
	});
};
