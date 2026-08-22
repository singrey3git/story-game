import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

// Tracks which player_numbers currently have a live presence in the room.
// Presence is ephemeral (socket-based) so it reflects "is their tab open right
// now", independent of the persisted `connected` column on the players row.
export function usePresence(roomId, userId, myPlayerNumber) {
  const [onlinePlayerNumbers, setOnlinePlayerNumbers] = useState([])
  const channelRef = useRef(null)

  useEffect(() => {
    if (!roomId || !userId || !myPlayerNumber) return undefined

    const channel = supabase.channel(`presence-room-${roomId}`, {
      config: { presence: { key: userId } },
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const numbers = Object.values(state)
          .flat()
          .map((entry) => entry.player_number)
        setOnlinePlayerNumbers(numbers)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ player_number: myPlayerNumber })
        }
      })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [roomId, userId, myPlayerNumber])

  return onlinePlayerNumbers
}
