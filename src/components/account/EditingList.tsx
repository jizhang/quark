import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
} from '@mui/material'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  MouseSensor,
  DragOverlay,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import _ from 'lodash'
import { type AccountGroup } from '@/components/account/use-accounts'
import EditingItem from './EditingItem'

interface Props {
  group: AccountGroup
  deleteAccount: (id: number) => void
  moveAccount: (activeId: number, overId: number) => void
}

export default (props: Props) => {
  const sensors = useSensors(useSensor(TouchSensor), useSensor(MouseSensor))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over === null || over.id === active.id) {
      return
    }
    props.moveAccount(active.id as number, over.id as number)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <List>
        <ListSubheader>{props.group.name}</ListSubheader>
        <SortableContext
          items={props.group.accounts}
          strategy={verticalListSortingStrategy}
        >
          {props.group.accounts.map(account => (
            <EditingItem
              key={account.id}
              account={account}
              onDelete={props.deleteAccount}
            />
          ))}
        </SortableContext>
      </List>
    </DndContext>
  )
}
