import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { walletApi, WalletApi } from './wallet-api'
import { giftsApi, GiftsApi } from './gifts-api'
import { creatorsApi, CreatorsApi } from './creators-api'
import { authApi, AuthApi } from './auth-api'

/**
 * React Query hooks for the FoodieFinds API
 */

// Wallet hooks
export function useWallet(userId: string, options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['wallet', userId],
        queryFn: () => walletApi.getWallet(userId),
        ...options,
    })
}

export function useRechargeWallet(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: walletApi.recharge,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['wallet', variables.userId] })
        },
        ...options,
    })
}

export function useDeductForCall(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: walletApi.deductForCall,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['wallet', variables.userId] })
        },
        ...options,
    })
}

// Gifts hooks
export function useActiveGifts(options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['gifts', 'active'],
        queryFn: () => giftsApi.getActiveGifts(),
        ...options,
    })
}

export function useSendGift(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: giftsApi.sendGift,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['gifts', 'active'] })
            queryClient.invalidateQueries({ queryKey: ['wallet', variables.senderId] })
        },
        ...options,
    })
}

// Creators hooks
export function useAllCreators(options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['creators', 'all'],
        queryFn: () => creatorsApi.getAllCreators(),
        ...options,
    })
}

export function useCreatorById(creatorId: string, options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['creators', creatorId],
        queryFn: () => creatorsApi.getCreatorById(creatorId),
        enabled: !!creatorId,
        ...options,
    })
}

export function useCreatorPerformance(creatorId: string, options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['creators', creatorId, 'performance'],
        queryFn: () => creatorsApi.getCreatorPerformance(creatorId),
        enabled: !!creatorId,
        ...options,
    })
}

export function useFollowCreator(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ userId, creatorId }: { userId: string; creatorId: string }) =>
            creatorsApi.followCreator(userId, creatorId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['creators', variables.creatorId] })
            queryClient.invalidateQueries({ queryKey: ['followed-creators', variables.userId] })
        },
        ...options,
    })
}

export function useUnfollowCreator(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ userId, creatorId }: { userId: string; creatorId: string }) =>
            creatorsApi.unfollowCreator(userId, creatorId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['creators', variables.creatorId] })
            queryClient.invalidateQueries({ queryKey: ['followed-creators', variables.userId] })
        },
        ...options,
    })
}

export function useFollowedCreators(userId: string, options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['followed-creators', userId],
        queryFn: () => creatorsApi.getFollowedCreators(userId),
        enabled: !!userId,
        ...options,
    })
}

// Auth hooks
export function useSendAdminOTP(options?: UseMutationOptions) {
    return useMutation({
        mutationFn: authApi.sendAdminOTP,
        ...options,
    })
}

export function useVerifyAdminOTP(options?: UseMutationOptions) {
    return useMutation({
        mutationFn: ({ mobileNumber, otp }: { mobileNumber: string; otp: string }) =>
            authApi.verifyAdminOTP(mobileNumber, otp),
        ...options,
    })
}

export function useSendCreatorOTP(options?: UseMutationOptions) {
    return useMutation({
        mutationFn: authApi.sendCreatorOTP,
        ...options,
    })
}

export function useVerifyCreatorOTP(options?: UseMutationOptions) {
    return useMutation({
        mutationFn: ({ mobileNumber, otp }: { mobileNumber: string; otp: string }) =>
            authApi.verifyCreatorOTP(mobileNumber, otp),
        ...options,
    })
}

export function useCurrentAdmin(options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['auth', 'admin', 'current'],
        queryFn: () => authApi.getCurrentAdmin(),
        ...options,
    })
}

export function useCurrentCreator(options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['auth', 'creator', 'current'],
        queryFn: () => authApi.getCurrentCreator(),
        ...options,
    })
}

export function useLogout(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            queryClient.clear()
        },
        ...options,
    })
}

// Search hooks
export function useSearchCreators(query: string, options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['creators', 'search', query],
        queryFn: () => creatorsApi.searchCreators(query),
        enabled: !!query && query.length >= 2,
        ...options,
    })
}

// Top creators hooks
export function useTopCreators(limit: number = 10, options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['creators', 'top', limit],
        queryFn: () => creatorsApi.getTopCreators(limit),
        ...options,
    })
}

// Admin hooks
export function usePendingCreators(options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['admin', 'creators', 'pending'],
        queryFn: () => creatorsApi.getPendingCreators(),
        ...options,
    })
}

export function useApproveCreator(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (creatorId: string) => creatorsApi.approveCreator(creatorId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'creators', 'pending'] })
        },
        ...options,
    })
}

export function useRejectCreator(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ creatorId, reason }: { creatorId: string; reason: string }) =>
            creatorsApi.rejectCreator(creatorId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'creators', 'pending'] })
        },
        ...options,
    })
}

export function useAllGifts(options?: UseQueryOptions) {
    return useQuery({
        queryKey: ['admin', 'gifts', 'all'],
        queryFn: () => giftsApi.getAllGifts(),
        ...options,
    })
}

export function useCreateGift(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: giftsApi.createGift,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'gifts', 'all'] })
            queryClient.invalidateQueries({ queryKey: ['gifts', 'active'] })
        },
        ...options,
    })
}

export function useUpdateGift(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => giftsApi.updateGift(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'gifts', 'all'] })
            queryClient.invalidateQueries({ queryKey: ['gifts', 'active'] })
        },
        ...options,
    })
}

export function useDeleteGift(options?: UseMutationOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => giftsApi.deleteGift(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'gifts', 'all'] })
            queryClient.invalidateQueries({ queryKey: ['gifts', 'active'] })
        },
        ...options,
    })
}