import { Request, Response } from 'express'
import axios from 'axios'
import { minify } from '../utils/helper.utils'
import { logger } from '../utils/logger.utils';
import { v4 as uuid } from 'uuid'


/**
 * Exposed service endpoint.
 * - Receives a POST request, parses the action and the controller
 * and returns it to the correct controller. We should be use 3. `Cart`, `Order` and `Payments`
 *
 * @param {Request} req The express request
 * @param {Response} res The express response
 * @returns
 */

class Gateway {
  public request:any
  public uuid:any
  public startAt:any

  constructor(baseURL: any) {
    this.request = axios.create({ baseURL })
    this.intRequest()
    this.intResponse()
  }

  public intRequest() {
    this.request.interceptors.request.use(
      async (config: any) => {
        this.uuid = uuid
        config.timeout = 1000 * 60
        config.headers = {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
        this.startAt = process.hrtime()
        const logData = `MPGW API Request ${config.method.toUpperCase()} ${config.baseURL}${config.url}`
        const metaData = {
          log_type: 'axioslog',
          log_name: 'mpgw-request',
          id: this.uuid,
          mpgw: {
            req: {
              url: `${config.baseURL}${config.url}`,
              method: config.method.toUpperCase(),
              headers: config.headers,
              data: config?.data ? minify(config.data) : null
            }
          }
        }
        logger.info(logData, metaData)
        return config
      },
      (err: any) => {
        return Promise.reject(err)
      }
    )
  }

  public intResponse() {
    this.request.interceptors.response.use(
      (response: any) => {
        const logData = `MPGW API Response ${response.status} ${response.statusText} ${this.duration()}ms`
        const metaData = {
          log_type: 'axioslog',
          log_name: 'mpgw-response',
          id: this.uuid,
          mpgw: {
            res: {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
              data: minify(response.data)
            }
          },
          duration: this.duration()
        }
        logger.info(logData, metaData)
        return response
      },
      (err: any) => {
        let _status, _statusText, _header, _data
        if (err.response) {
          _status = err.response.status
          _statusText = err.response.statusText
          _header = err.response.headers
          _data = minify(err.response.data)
        } else {
          _status = 500
          _statusText = err.message
          _header = null
          _data = null
        }
        const logData = `MPGW API Error Response ${_status} ${_statusText} ${this.duration()}ms`
        const metaData = {
          log_type: 'axioslog',
          log_name: 'mpgw-response',
          id: this.uuid,
          mpgw: {
            res: {
              status: _status,
              statusText: _statusText,
              headers: _header,
              data: _data
            }
          },
          duration: this.duration()
        }
        logger.error(logData, metaData)
        return Promise.reject(err)
      }
    )
  }

  public duration(digits?: any) {
    const elapsed = process.hrtime(this.startAt)
    const ms = elapsed[0] * 1e3 + elapsed[1] * 1e-6
    return digits ? ms.toFixed(digits) : Math.ceil(Math.round(ms * 1) / 1)
  }
}

export const post = async (req: Request, res: Response) => {
  const gateway = new Gateway(req.body.url)
  await gateway.request.get('/')
  res.status(200).send()
  return
};
