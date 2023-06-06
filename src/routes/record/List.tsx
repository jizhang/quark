import React, { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Box,
  Avatar,
  List,
  ListSubheader,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
} from '@mui/material'
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  SwapHoriz,
  ArrowRight,
} from '@mui/icons-material'
import _ from 'lodash'
import dayjs from 'dayjs'
import * as consts from '@/common/consts'
import * as service from '@/services/record'
import Nav from '@/components/record/ListNav'
import TitleAmount from '@/components/TitleAmount'

type State = Record<string, string>
type SetState = (state: State) => void

function optInt(params: State, key: string) {
  return params[key] ? _.toInteger(params[key]) : undefined
}

function parseFilterForm(params: State) {
  const form: service.FilterForm = {
    record_type: optInt(params, 'record_type'),
    account_id: optInt(params, 'account_id'),
  }

  if (form.record_type) {
    form.category_id = optInt(params, 'category_id')
  }

  return form
}

function useQueryState(initialState: State): [State, SetState] {
  const [searchParams, setSearchParams] = useSearchParams()
  const mergedState = {
    ...initialState,
    ...Object.fromEntries(searchParams),
  }

  const [state, setState] = useState(mergedState)

  useEffect(() => {
    if (!_.isEqual(state, mergedState)) {
      setState(mergedState)
    }
  }, [searchParams])

  return [state, setSearchParams]
}

interface RecordGroup {
  month: string
  total: number
  records: service.RecordItem[]
}

function makeGroups(records: service.RecordItem[]) {
  const groups: RecordGroup[] = []

  _.forEach(records, record => {
    const month = dayjs(record.record_time).format('MMM YYYY')
    let group = _.find(groups, ['month', month])

    if (_.isUndefined(group)) {
      group = {
        month,
        total: 0.0,
        records: [],
      }
      groups.push(group)
    }

    group.records.push(record)

    if (record.record_type !== consts.RECORD_TYPE_TRANSFER) {
      group.total += _.toNumber(record.amount)
    }
  })

  return groups
}

export default () => {
  const [filterState, setFilterState] = useQueryState({})
  const filterForm = parseFilterForm(filterState)

  function handleChangeFilterForm(values: service.FilterForm) {
    const newParams = _(values).pickBy().mapValues(_.toString).value()
    setFilterState(newParams)
  }

  const [data, setData] = useState<service.RecordItem[]>([])

  useEffect(() => {
    service.getRecordList(filterForm).then(payload => {
      setData(payload.data)
    })
  }, [filterState])

  function getIcon(recordType: number) {
    if (recordType === consts.RECORD_TYPE_EXPENSE) return <UploadIcon />
    if (recordType === consts.RECORD_TYPE_INCOME) return <DownloadIcon />
    if (recordType === consts.RECORD_TYPE_TRANSFER) return <SwapHoriz />
  }

  function getPrimaryText(item: service.RecordItem) {
    let title: React.ReactNode
    if (item.record_type === consts.RECORD_TYPE_TRANSFER) {
      title = (
        <Box display="flex">
          {item.account_name}
          <ArrowRight />
          {item.target_account_name}
        </Box>
      )
    } else {
      title = item.category_name
    }

    return <TitleAmount title={title} amount={item.amount} />
  }

  function getSecondaryText(item: service.RecordItem) {
    const time = dayjs(item.record_time).format('MMM D HH:mm')
    return item.remark ? `${time} - ${item.remark}` : time
  }

  return (
    <Box>
      <Nav filterForm={filterForm} onChangeFilterForm={handleChangeFilterForm} />
      <List>
        {makeGroups(data).map(group => (
          <React.Fragment key={group.month}>
            <ListSubheader>
              <TitleAmount title={group.month} amount={group.total} />
            </ListSubheader>
            {group.records.map(item => (
              <ListItem
                key={item.id}
                disablePadding
              >
                <ListItemButton
                  component={Link}
                  to={{ pathname: '/record/edit', search: `id=${item.id}` }}
                  alignItems="flex-start"
                >
                  <ListItemAvatar><Avatar>{getIcon(item.record_type)}</Avatar></ListItemAvatar>
                  <ListItemText primary={getPrimaryText(item)} secondary={getSecondaryText(item)} />
                </ListItemButton>
              </ListItem>
            ))}
          </React.Fragment>
        ))}
        {data.length == 0 && (
          <ListItem>
            <ListItemText>No data</ListItemText>
          </ListItem>
        )}
      </List>
    </Box>
  )
}
