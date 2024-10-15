'use strict'

const _ = require('lodash');
const {Types} = require('mongoose');

const convertToObjectIdMongodb = id => Types.ObjectId(id)

const getInfoData = ({fields = [], object = {}}) => {
    return _.pick(object, fields)
}

const getSelectData = (select = []) => {
    return Object.fromEntries(select.map( el => [el,1]))
}

const unSelectData = (select = []) => {
    return Object.fromEntries(select.map( el => [el,0]))
}

const removeUndefinedObject = object => {
    Object.keys(object).forEach(k => {
        if(object[k] == null){
            delete object[k]
        }
    });
    return object
}

/*
    const a = {
        c: {
            d: 1,
            e: 2
            }
    }

    db.collection.updateOne({
        `c.d`: 1,
        `c.e`: 2
    })
*/

const updateNestedObjectParser = object => {
    const final = {};
  
    Object.keys(object || {}).forEach(key => {
      if (typeof object[key] === 'object' && !Array.isArray(object[key])) {
        const response = updateNestedObjectParser(object[key]);
  
        Object.keys(response || {}).forEach(a => {
          final[`${key}.${a}`] = response[a];
        });
      } else {
        final[key] = object[key];
      }
    });
  
    return final;
}
module.exports = {
    getInfoData,
    getSelectData,
    unSelectData,
    removeUndefinedObject,
    updateNestedObjectParser,
    convertToObjectIdMongodb
}