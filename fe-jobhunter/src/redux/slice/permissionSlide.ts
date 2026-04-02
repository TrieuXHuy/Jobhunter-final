import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callFetchPermission } from '@/config/api';
import { IPermission } from '@/types/backend';

interface IState {
    isFetching: boolean;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    },
    result: IPermission[]
}

export const fetchPermission = createAsyncThunk(
    'permission/fetchPermission',
    async ({ query }: { query: string }) => {
        const response = await callFetchPermission(query);
        return response;
    }
)

const initialState: IState = {
    isFetching: true,
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0
    },
    result: []
};

export const permissionSlide = createSlice({
    name: 'permission',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchPermission.pending, (state, action) => {
            state.isFetching = true;
        })

        builder.addCase(fetchPermission.rejected, (state, action) => {
            state.isFetching = false;
        })

        builder.addCase(fetchPermission.fulfilled, (state, action) => {
            if (action.payload && action.payload.data) {
                state.isFetching = false;
                state.meta = action.payload.data.meta;
                state.result = action.payload.data.result;
            }
        })
    },

});

export default permissionSlide.reducer;
