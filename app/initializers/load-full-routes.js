
import Ember from 'ember';
import _ from 'lodash';
import fullConfig from '../helpers/full-config';

export default {
  name: 'load-full-routes',
  addRoute(route) {
    fullConfig.routes.push(route);
  },
  initialize(application) {
    application.deferReadiness();
    fullConfig.getConfig()
      .then(config => {
        this.registerRoot(config, application);
        this.setUpInjections(application);
        application.advanceReadiness();
      });
  },
  setUpInjections(application) {
    application.inject('component','router','router:main');
  },
  registerRoot(config, application) {
    const model = {
      model() {
        return {
          nav    : config,
          content: config.get('content'),
          route: {
            full: '',
            base: '',
            end: ''
          }
        };
      },
      activate() {
        console.debug('Entering route [application]');
        this._super();
      }
    }
    this.registerRoute('application', model, application);
    this.registerContent(config.get('content'), application, []);
  },
  registerContent(content, application, stack) {
    if(content.invoke('isTabs')) {
      content.invoke('each', t => this.registerTab(t, application, stack));
    } else if(content.invoke('isForm')) {
      content.invoke('each', f => this.registerForm(f, application, stack));
    }
  },
  registerTab(tab, application, stack) {
    const tabStack = _.concat(stack, _.get(tab,'name'));
    const route = tabStack.join('.');
    const content = tab.get('content');
    const routeDef = {
      templateName: 'components/content-wrapper',
      model() {
        return {
          route: {
            full: route,
            base: _.initial(route.split('.')).join('.'),
            end : tab.get('name')
          },
          content: content
        };
      }
    };
    this.registerRoute(route, routeDef, application);
    this.registerContent(content, application, tabStack);
  },
  registerForm(form, application, stack) {
    const route = stack.join('.');
    this.log('Registering controller at route [' + route + ']');
    const queryParamKeys = form.invoke('fieldValues');
    queryParamKeys.push('as');
    application.register('controller:' + route, Ember.Object.extend({
      queryParams: queryParamKeys,
      qp: Ember.computed('model', function() {
        var obj = {};
        _.map(queryParamKeys, key => {
          obj[key] = this.get(key);
        });
        return obj;
      })
    }));
  },
  registerRoute(route, routeDef, application) {
    const self = this;
    this.log('Registering route: [' + route + ']');
    if(route !== 'application') {
      this.addRoute(route);
    }
    application.register('route:' + route, Ember.Route.extend(_.assignIn(routeDef,{
      activate() {
        self.log('Entering route [' + route + ']');
        this._super();
      }
    })));
  },
  log(message)  {
    if(false) {
      console.debug(message);
    }
  }
};